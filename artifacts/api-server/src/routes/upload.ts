import { Router } from "express";

const router = Router();

router.post("/upload-photo", async (req, res) => {
  console.log("UPLOAD HIT");

  return res.json({
    ok: true,
    message: "server works",
  });
});

export default router;
