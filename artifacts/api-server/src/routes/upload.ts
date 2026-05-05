import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { requireUser } from "../middlewares/auth";
import { strictLimiter } from "../middlewares/rateLimit";
import { validateBody } from "../middlewares/validate";
import { UploadPhotoBody } from "@workspace/api-zod";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

const BUCKET = "yacht-photos";

function getSupabaseAdmin() {
  // Accept either SUPABASE_URL (server-style) or VITE_SUPABASE_URL (the var
  // the rest of this monorepo exposes). Production deploys typically only set
  // one of the two — falling back keeps uploads working in both setups.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function detectImageMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

function safeExtension(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

router.post("/", strictLimiter, requireUser, upload.single("photo"), validateBody(UploadPhotoBody), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file received" });
    }

    const sniffed = detectImageMime(req.file.buffer);
    if (!sniffed) {
      return res.status(415).json({
        success: false,
        error: "File contents are not a valid JPEG, PNG, or WebP image.",
      });
    }
    if (sniffed !== req.file.mimetype) {
      return res.status(415).json({
        success: false,
        error: "File contents do not match the declared type.",
      });
    }

    const supabase = getSupabaseAdmin();
    const ext = safeExtension(sniffed);
    const path = `uploads/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: sniffed,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error.message);
      return res.status(500).json({ success: false, error: "Upload failed" });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return res.status(200).json({ success: true, url: data.publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Upload failed",
    });
  }
});

export default router;
