import { Router } from "express";

const router = Router();

router.post("/upload-photo", (req, res) => {
  console.log("UPLOAD REAL HIT");

  return res.send("OK");
});

export default router;
