import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const BUCKET = "yacht-photos";

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

// ✅ UPLOAD ROUTE
router.post("/upload-photo", upload.single("file"), async (req, res) => {
  try {
    console.log("🔥 UPLOAD HIT");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file received",
      });
    }

    const supabase = getSupabaseAdmin();

    const path = `uploads/${Date.now()}-${req.file.originalname}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("SUPABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return res.status(200).json({
      success: true,
      url: data.publicUrl,
    });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Upload failed",
    });
  }
});

export default router;
