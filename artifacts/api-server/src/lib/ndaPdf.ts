import PDFDocument from "pdfkit";
import { readFileSync, existsSync } from "fs";
import path from "path";

// We deliberately avoid `import.meta.url` here — esbuild bundles this module to CJS,
// where `import.meta.url` is `undefined` and would crash at module load.
// Both dev (tsx, run from artifact root) and prod (bundled, run from monorepo root)
// have stable resolutions relative to process.cwd().
const FONT_CANDIDATES = [
  // Prod: bundled dist, run as `node artifacts/api-server/dist/index.cjs` from monorepo root.
  "artifacts/api-server/dist/assets/fonts/GreatVibes-Regular.ttf",
  // Dev: tsx run from artifact dir (cwd = artifacts/api-server).
  "src/assets/fonts/GreatVibes-Regular.ttf",
  // Dev: tsx run from monorepo root.
  "artifacts/api-server/src/assets/fonts/GreatVibes-Regular.ttf",
  // Prod fallback if cwd is the artifact dir.
  "dist/assets/fonts/GreatVibes-Regular.ttf",
];

let cachedFont: Buffer | null | undefined; // undefined = not tried; null = tried & missing
function loadCalligraphicFont(): Buffer | null {
  if (cachedFont !== undefined) return cachedFont;
  for (const rel of FONT_CANDIDATES) {
    const abs = path.resolve(process.cwd(), rel);
    if (existsSync(abs)) {
      cachedFont = readFileSync(abs);
      return cachedFont;
    }
  }
  console.warn(`[ndaPdf] Calligraphic font not found (cwd=${process.cwd()}). Falling back to italic Times.`);
  cachedFont = null;
  return cachedFont;
}

export interface NdaPdfDocument {
  title: string;
  version: string;
  content: string;
  content_hash: string;
}

export interface NdaPdfSignature {
  signature_name: string;
  user_email: string;
  signed_at: string | Date;
  ip: string | null;
  user_agent: string | null;
  document_version: string;
  document_hash: string;
}

/**
 * Generate a self-contained PDF of the signed CNCA. Returns a Buffer (PDF bytes).
 * Layout:
 *   Cover header — PDYE branding, title, version, hash.
 *   Body — full CNCA text with proper line wrapping & section breaks.
 *   Signature block — calligraphic name, printed name, date/time, IP, user agent, hashes.
 */
export function generateNdaPdf(input: { document: NdaPdfDocument; signature: NdaPdfSignature }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 56, bottom: 56, left: 64, right: 64 },
        bufferPages: true,
        info: {
          Title: `${input.document.title} — ${input.document.version}`,
          Author: "PDYE Holdings",
          Subject: "Platform Confidentiality & Non-Circumvention Agreement (signed)",
          Keywords: `CNCA, PDYE, ${input.document.version}, ${input.signature.user_email}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", c => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const NAVY = "#0a1426";
      const GOLD = "#c8a46b";
      const MUTED = "#5a6577";

      const calligraphic = loadCalligraphicFont();
      if (calligraphic) {
        doc.registerFont("Calligraphic", calligraphic);
      }

      // === Cover header ===
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("PRIVATE DISTRESSED YACHT EXCHANGE", { characterSpacing: 3 });
      doc.moveDown(0.2);
      doc
        .fillColor(GOLD)
        .font("Helvetica")
        .fontSize(20)
        .text(input.document.title, { lineGap: 2 });
      doc.moveDown(0.3);
      doc
        .fillColor(MUTED)
        .font("Helvetica")
        .fontSize(9)
        .text(`Version: ${input.document.version}`, { continued: true })
        .text(`     Document hash: ${input.document.content_hash}`);
      doc.moveDown(0.2);
      doc
        .fillColor(MUTED)
        .fontSize(9)
        .text(`Signed by: ${input.signature.user_email}`, { continued: true })
        .text(`     Signed at: ${new Date(input.signature.signed_at).toISOString()} UTC`);

      // Divider
      doc.moveDown(0.8);
      const dividerY = doc.y;
      doc
        .strokeColor(GOLD)
        .lineWidth(0.6)
        .moveTo(doc.page.margins.left, dividerY)
        .lineTo(doc.page.width - doc.page.margins.right, dividerY)
        .stroke();
      doc.moveDown(1);

      // === Body — full CNCA text ===
      doc.fillColor("#1a1a1a").font("Helvetica").fontSize(10);
      // Render the text exactly as stored (it already contains the section structure).
      // Bold the leading "N. SECTION TITLE" lines for readability.
      const lines = input.document.content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        const isSectionHeader = /^\d+\.\s+[A-Z][A-Z0-9 ;,'"\-/&]+$/.test(trimmed);
        if (trimmed === "") {
          doc.moveDown(0.5);
          continue;
        }
        if (isSectionHeader) {
          doc.moveDown(0.3);
          doc.font("Helvetica-Bold").fillColor(NAVY).fontSize(10.5).text(trimmed, { lineGap: 1.5 });
          doc.font("Helvetica").fillColor("#1a1a1a").fontSize(10);
        } else {
          doc.text(line, { lineGap: 1.5, align: "justify" });
        }
      }

      // === Signature block (new page if needed) ===
      const blockHeightEstimate = 220;
      if (doc.y + blockHeightEstimate > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }

      // Block frame
      const blockTop = doc.y;
      const blockLeft = doc.page.margins.left;
      const blockWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc
        .strokeColor(GOLD)
        .lineWidth(0.6)
        .rect(blockLeft, blockTop, blockWidth, 200)
        .stroke();

      const inner = blockLeft + 18;
      let cursor = blockTop + 16;

      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("ELECTRONIC SIGNATURE — RECIPIENT", inner, cursor, { characterSpacing: 2.5 });
      cursor += 18;

      // Calligraphic signature
      if (calligraphic) {
        doc.font("Calligraphic").fontSize(38).fillColor(NAVY).text(input.signature.signature_name, inner, cursor, { width: blockWidth - 36 });
      } else {
        doc.font("Times-Italic").fontSize(28).fillColor(NAVY).text(input.signature.signature_name, inner, cursor, { width: blockWidth - 36 });
      }
      cursor = doc.y + 4;

      // Underline under signature
      doc
        .strokeColor(NAVY)
        .lineWidth(0.4)
        .moveTo(inner, cursor)
        .lineTo(blockLeft + blockWidth - 18, cursor)
        .stroke();
      cursor += 6;

      // Printed name
      doc
        .fillColor("#1a1a1a")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Printed name: ${input.signature.signature_name}`, inner, cursor);
      cursor = doc.y + 4;

      // Audit fields
      const auditRows: [string, string][] = [
        ["Email", input.signature.user_email],
        ["Date / Time (UTC)", new Date(input.signature.signed_at).toISOString()],
        ["IP address", input.signature.ip || "—"],
        ["User agent", (input.signature.user_agent || "—").slice(0, 110)],
        ["Document version", input.signature.document_version],
        ["Document hash (SHA-256)", input.signature.document_hash],
      ];
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
      for (const [k, v] of auditRows) {
        doc.text(`${k}:`, inner, cursor, { continued: true })
           .fillColor("#1a1a1a")
           .text(`  ${v}`, { width: blockWidth - 36 });
        doc.fillColor(MUTED);
        cursor = doc.y + 1;
      }

      // === Counterparty (PDYE pre-signed) ===
      if (cursor + 80 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        cursor = doc.page.margins.top;
      } else {
        cursor += 18;
      }

      doc
        .fillColor(MUTED)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("COUNTERPARTY — PDYE HOLDINGS", inner, cursor, { characterSpacing: 2.5 });
      cursor += 16;
      if (calligraphic) {
        doc.font("Calligraphic").fontSize(34).fillColor(NAVY).text("PDYE Holdings", inner, cursor);
      } else {
        doc.font("Times-Italic").fontSize(26).fillColor(NAVY).text("PDYE Holdings", inner, cursor);
      }
      cursor = doc.y + 4;
      doc
        .strokeColor(NAVY)
        .lineWidth(0.4)
        .moveTo(inner, cursor)
        .lineTo(blockLeft + blockWidth - 18, cursor)
        .stroke();
      cursor += 6;
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(MUTED)
        .text("Pre-signed by the duly authorized representative of PDYE Holdings at platform inception. Counterparty signature on file.", inner, cursor, { width: blockWidth - 36 });

      // Footer on every page
      const pageRange = doc.bufferedPageRange();
      for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(pageRange.start + i);
        const footerY = doc.page.height - 36;
        doc
          .fillColor(MUTED)
          .font("Helvetica")
          .fontSize(7)
          .text(
            `PDYE — ${input.document.title} ${input.document.version}   ·   Signed by ${input.signature.user_email}   ·   Page ${i + 1} of ${pageRange.count}`,
            doc.page.margins.left,
            footerY,
            { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "center" }
          );
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
