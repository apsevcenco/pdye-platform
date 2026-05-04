import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const BUCKET = "yacht-photos";

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

router.post("/upload-photo", upload.single("file"), async (req, res) => {
  console.log("UPLOAD HIT");

  try {
    if (!req.file) {
      console.log("NO FILE");
      return res.status(400).json({ error: "No file" });
    }

    const sb = supabase();

    const path = `uploads/${Date.now()}-${req.file.originalname}`;

    const { error } = await sb.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.log("SUPABASE ERROR", error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);

    return res.json({
      success: true,
      url: data.publicUrl,
    });

  } catch (e: any) {
    console.log("CRASH", e);
    return res.status(500).json({ error: e.message });
  }
});

export default router;
