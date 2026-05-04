import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const BUCKET = "yacht-photos";

// Supabase client
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

// Upload route
router.post("/upload-photo", upload.single("file"), async (req, res) => {
  console.log("UPLOAD START");

  try {
    // check file
    if (!req.file) {
      console.log("NO FILE RECEIVED");
      return res.status(400).json({ error: "No file provided" });
    }

    console.log("FILE:", req.file.originalname, req.file.size);

    const supabase = getSupabaseAdmin();

    const yachtId = (req.body?.yachtId as string) || "misc";

    const fileExt =
      req.file.originalname.split(".").pop() || "bin";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${fileExt}`;

    const path = `${yachtId}/${fileName}`;

    console.log("UPLOAD PATH:", path);

    // upload to supabase
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

    // get public url
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    console.log("SUCCESS URL:", data.publicUrl);

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
