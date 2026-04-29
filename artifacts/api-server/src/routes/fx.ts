import { Router } from "express";

const router = Router();

type FxCache = { at: number; rates: { EUR: number; USD: number; GBP: number } };
let cache: FxCache | null = null;
const TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK = { EUR: 1, USD: 1.08, GBP: 0.86 };

router.get("/fx/rates", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache && now - cache.at < TTL_MS) {
      res.json({ rates: cache.rates, fetchedAt: new Date(cache.at).toISOString(), cached: true });
      return;
    }
    const r = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,GBP");
    if (!r.ok) throw new Error("upstream " + r.status);
    const data: any = await r.json();
    const rates = {
      EUR: 1,
      USD: Number(data?.rates?.USD) || FALLBACK.USD,
      GBP: Number(data?.rates?.GBP) || FALLBACK.GBP,
    };
    cache = { at: now, rates };
    res.json({ rates, fetchedAt: new Date(now).toISOString(), cached: false });
  } catch (e: any) {
    res.json({ rates: FALLBACK, fetchedAt: new Date().toISOString(), cached: false, fallback: true, error: e?.message });
  }
});

export default router;
