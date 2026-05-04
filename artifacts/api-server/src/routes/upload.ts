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
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error("Missing Supabase env");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

router.post("/upload-photo", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD START");

    if (!req.file) {
      console.log("NO FILE");
      return res.status(400).json({ error: "No file" });
    }

    const supabase = getSupabaseAdmin();

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const path = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("UPLOAD ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    console.log("SUCCESS:", data.publicUrl);

    return res.json({
      success: true,
      url: data.publicUrl,
    });

  } catch (e: any) {
    console.error("CRASH:", e);
    return res.status(500).json({
      error: e.message || "Upload failed",
    });
  }
});

export default router;
