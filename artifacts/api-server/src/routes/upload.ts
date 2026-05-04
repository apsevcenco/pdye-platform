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

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

router.post("/upload-photo", async (req: any, res: any) => {
  try {
    console.log("UPLOAD HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }

    const supabase = getSupabaseAdmin();

    const path = `uploads/${Date.now()}-${req.file.originalname}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return res.json({
      success: true,
      url: data.publicUrl,
    });

  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
