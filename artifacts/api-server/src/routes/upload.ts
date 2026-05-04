import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET = "yacht-photos";

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// 👇 ТОЛЬКО ЭТОТ РОУТ (новый)
router.post("/upload-photo", upload.single("file"), async (req, res) => {
  console.log("UPLOAD START");

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const supabase = getSupabaseAdmin();

    const path = `test/${Date.now()}-${req.file.originalname}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return res.json({
      success: true,
      url: data.publicUrl,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
