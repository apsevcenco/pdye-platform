import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { requireUser } from "../middlewares/auth";
import { strictLimiter } from "../middlewares/rateLimit";
import { validateBody } from "../middlewares/validate";
import { UploadDocumentBody } from "@workspace/api-zod";

const router = Router();

const MAX_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF documents are allowed"));
      return;
    }
    cb(null, true);
  },
});

const BUCKET = "yacht-photos";

function getSupabaseAdmin() {
  // Accept either SUPABASE_URL (server-style) or VITE_SUPABASE_URL (the var
  // the rest of this monorepo exposes). Mirrors upload.ts so PDF uploads
  // work in any environment that has either name set.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Magic-byte sniff for PDF — `%PDF-` (0x25 0x50 0x44 0x46 0x2D). Mirrors the
 *  approach in upload.ts so we don't trust client-supplied MIME alone. */
function isPdfBuffer(buf: Buffer): boolean {
  if (buf.length < 5) return false;
  return (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  );
}

router.post(
  "/",
  strictLimiter,
  requireUser,
  upload.single("document"),
  validateBody(UploadDocumentBody),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file received" });
      }
      if (!isPdfBuffer(req.file.buffer)) {
        return res.status(415).json({
          success: false,
          error: "File contents are not a valid PDF.",
        });
      }
      if (req.file.mimetype !== "application/pdf") {
        return res.status(415).json({
          success: false,
          error: "File contents do not match the declared type.",
        });
      }

      const supabase = getSupabaseAdmin();
      const path = `docs/${Date.now()}-${randomBytes(8).toString("hex")}.pdf`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, req.file.buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Supabase document upload error:", error.message);
        return res.status(500).json({ success: false, error: "Upload failed" });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return res.status(200).json({ success: true, url: data.publicUrl });
    } catch (err: any) {
      console.error("Document upload error:", err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Upload failed",
      });
    }
  },
);

export default router;
