import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const BUCKET = "yacht-photos";

function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false } });
}

router.post("/upload-photo", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const supabase = getSupabaseAdmin();
    const yachtId = (req.body.yachtId as string) || "misc";
    const folder = (req.body.folder as string) || "";
    const ext = req.file.originalname.split(".").pop() || "bin";
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = folder
      ? `${yachtId}/${folder}/${Date.now()}-${safeName}`
      : `${yachtId}/${Date.now()}.${ext}`;

    const { error: bucketErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (bucketErr && !bucketErr.message.includes("already exists")) {
      throw bucketErr;
    }

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

export default router;
