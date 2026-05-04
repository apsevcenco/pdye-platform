import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const BUCKET = "yacht-photos";

// Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * IMPORTANT:
 * multer MUST be used here, иначе req.file будет undefined
 */
router.post("/upload-photo", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD HIT");

    // ❗ критично: без multer тут всегда будет undefined
    if (!req.file) {
      console.log("NO FILE RECEIVED");
      return res.status(400).json({ error: "No file provided" });
    }

    const supabase = getSupabaseAdmin();

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `uploads/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return res.json({
      success: true,
      url: data.publicUrl,
    });

  } catch (err: any) {
    console.error("UPLOAD CRASH:", err);
    return res.status(500).json({
      error: err.message || "Upload failed",
    });
  }
});

export default router;
