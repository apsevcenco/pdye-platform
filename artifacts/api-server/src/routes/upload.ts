router.post("/upload-photo", upload.single("file"), async (req, res) => {
  console.log("UPLOAD HIT");

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("❌ ENV MISSING");
      return res.status(500).json({ error: "Supabase env missing" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const path = `uploads/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from("yacht-photos")
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    console.log("SUPABASE RESULT:", { data, error });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from("yacht-photos")
      .getPublicUrl(path);

    return res.json({
      success: true,
      url: urlData.publicUrl,
    });

  } catch (e: any) {
    console.log("CRASH:", e);
    return res.status(500).json({ error: e.message });
  }
});
export default router;
