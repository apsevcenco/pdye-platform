import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const BUCKET = "yacht-photos";

// Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE env variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

router.post("/upload-photo", upload.single("file"), async (req, res) => {
  console.log("➡️ upload-photo hit");

  try {
    if (!req.file) {
      console.log("❌ no file");
      return res.status(400).json({ error: "No file provided" });
    }

    const supabase = getSupabaseAdmin();

    const yachtId = (req.body?.yachtId as string) || "misc";

    const ext = req.file.originalname.split(".").pop() || "bin";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${ext}`;

    const path = `${yachtId}/${fileName}`;

    console.log("📦 uploading to:", path);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.log("❌ supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    console.log("✅ success:", data.publicUrl);

    return res.json({
      success: true,
      url: data.publicUrl,
    });
  } catch (err: any) {
    console.log("💥 crash:", err);
    return res.status(500).json({
      error: err.message || "Upload failed",
    });
  }
});

export default router;
