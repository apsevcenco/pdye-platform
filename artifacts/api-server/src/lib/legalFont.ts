import { readFileSync, existsSync } from "fs";
import path from "path";

const FONT_CANDIDATES = [
  "artifacts/api-server/dist/assets/fonts/GreatVibes-Regular.ttf",
  "src/assets/fonts/GreatVibes-Regular.ttf",
  "artifacts/api-server/src/assets/fonts/GreatVibes-Regular.ttf",
  "dist/assets/fonts/GreatVibes-Regular.ttf",
];

let cachedFont: Buffer | null | undefined;

export function loadCalligraphicFont(): Buffer | null {
  if (cachedFont !== undefined) return cachedFont;
  for (const rel of FONT_CANDIDATES) {
    const abs = path.resolve(process.cwd(), rel);
    if (existsSync(abs)) {
      cachedFont = readFileSync(abs);
      return cachedFont;
    }
  }
  console.warn(`[legalFont] Calligraphic font not found (cwd=${process.cwd()}). Falling back to italic Times.`);
  cachedFont = null;
  return cachedFont;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c] as string));
}

export function getClientIp(req: any): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real.trim();
  return req.socket?.remoteAddress || "";
}
