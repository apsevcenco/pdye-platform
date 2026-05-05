import { Router } from "express";
import { getSupabaseAdmin } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimit";

const router = Router();

router.get("/auth/check-email", authLimiter, async (req, res) => {
  try {
    const email = String(req.query["email"] || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const admin = getSupabaseAdmin();

    const { data: profileMatch, error: profileError } = await admin
      .from("users")
      .select("id")
      .ilike("email", email)
      .limit(1);

    if (profileError) {
      console.error("[auth/check-email] profile lookup failed:", profileError.message);
    }

    if (profileMatch && profileMatch.length > 0) {
      return res.json({ exists: true });
    }

    let page = 1;
    const perPage = 200;
    while (page <= 25) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("[auth/check-email] auth listUsers failed:", error.message);
        break;
      }
      const found = data.users.some(u => (u.email || "").toLowerCase() === email);
      if (found) return res.json({ exists: true });
      if (data.users.length < perPage) break;
      page += 1;
    }

    return res.json({ exists: false });
  } catch (err) {
    console.error("[auth/check-email] unexpected:", err);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default router;
