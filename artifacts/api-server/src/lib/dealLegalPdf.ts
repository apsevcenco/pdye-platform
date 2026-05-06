import PDFDocument from "pdfkit";
import { loadCalligraphicFont } from "./legalFont";

export interface DealLegalPdfDocument {
  title: string;
  version: string;
  content: string;
  content_hash: string;
}

export interface DealLegalPdfSignature {
  signature_name: string;
  user_email: string;
  signed_at: string | Date;
  ip: string | null;
  user_agent: string | null;
  document_version: string;
  document_hash: string;
  side: string;
}

export interface DealLegalPdfDealRef {
  deal_room_id: string;
  deal_room_code: string;
}

/**
 * Generate a self-contained PDF of a signed deal-room legal document
 * (CNCA, Commission Agreement, etc).
 */
export function generateDealLegalPdf(input: {
  document: DealLegalPdfDocument;
  signature: DealLegalPdfSignature;
  dealRef: DealLegalPdfDealRef;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 56, bottom: 56, left: 64, right: 64 },
        bufferPages: true,
        info: {
          Title: `${input.document.title} — ${input.dealRef.deal_room_code}`,
          Author: "PDYE Holdings",
          Subject: `Deal Room legal agreement (signed) — ${input.dealRef.deal_room_code}`,
          Keywords: `Deal Room, PDYE, ${input.document.version}, ${input.signature.user_email}, ${input.dealRef.deal_room_code}`,
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
      if (calligraphic) doc.registerFont("Calligraphic", calligraphic);

      // === Cover header ===
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9)
        .text("PRIVATE DISTRESSED YACHT EXCHANGE", { characterSpacing: 3 });
      doc.moveDown(0.2);
      doc.fillColor(GOLD).font("Helvetica").fontSize(20)
        .text(input.document.title, { lineGap: 2 });
      doc.moveDown(0.3);
      doc.fillColor(MUTED).font("Helvetica").fontSize(9)
        .text(`Deal Room: ${input.dealRef.deal_room_code}`, { continued: true })
        .text(`     Version: ${input.document.version}`);
      doc.moveDown(0.2);
      doc.fillColor(MUTED).fontSize(9)
        .text(`Document hash: ${input.document.content_hash}`);
      doc.moveDown(0.2);
      doc.fillColor(MUTED).fontSize(9)
        .text(`Signed by: ${input.signature.user_email} (${input.signature.side})`, { continued: true })
        .text(`     Signed at: ${new Date(input.signature.signed_at).toISOString()} UTC`);

      doc.moveDown(0.8);
      const dividerY = doc.y;
      doc.strokeColor(GOLD).lineWidth(0.6)
        .moveTo(doc.page.margins.left, dividerY)
        .lineTo(doc.page.width - doc.page.margins.right, dividerY).stroke();
      doc.moveDown(1);

      // === Body ===
      doc.fillColor("#1a1a1a").font("Helvetica").fontSize(10);
      const lines = input.document.content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        const isSectionHeader = /^\d+\.\s+[A-Z][A-Z0-9 ;,'"\-/&]+$/.test(trimmed);
        if (trimmed === "") { doc.moveDown(0.5); continue; }
        if (isSectionHeader) {
          doc.moveDown(0.3);
          doc.font("Helvetica-Bold").fillColor(NAVY).fontSize(10.5).text(trimmed, { lineGap: 1.5 });
          doc.font("Helvetica").fillColor("#1a1a1a").fontSize(10);
        } else {
          doc.text(line, { lineGap: 1.5, align: "justify" });
        }
      }

      // === Signature block ===
      const blockHeightEstimate = 220;
      if (doc.y + blockHeightEstimate > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }

      const blockTop = doc.y;
      const blockLeft = doc.page.margins.left;
      const blockWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      doc.strokeColor(GOLD).lineWidth(0.6).rect(blockLeft, blockTop, blockWidth, 200).stroke();

      const inner = blockLeft + 18;
      let cursor = blockTop + 16;

      const sideLabel = input.signature.side.toUpperCase();
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
        .text(`ELECTRONIC SIGNATURE — ${sideLabel}`, inner, cursor, { characterSpacing: 2.5 });
      cursor += 18;

      if (calligraphic) {
        doc.font("Calligraphic").fontSize(38).fillColor(NAVY)
          .text(input.signature.signature_name, inner, cursor, { width: blockWidth - 36 });
      } else {
        doc.font("Times-Italic").fontSize(28).fillColor(NAVY)
          .text(input.signature.signature_name, inner, cursor, { width: blockWidth - 36 });
      }
      cursor = doc.y + 4;

      doc.strokeColor(NAVY).lineWidth(0.4)
        .moveTo(inner, cursor).lineTo(blockLeft + blockWidth - 18, cursor).stroke();
      cursor += 6;

      doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(10)
        .text(`Printed name: ${input.signature.signature_name}`, inner, cursor);
      cursor = doc.y + 4;

      const auditRows: [string, string][] = [
        ["Email", input.signature.user_email],
        ["Side", sideLabel],
        ["Deal Room", input.dealRef.deal_room_code],
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

      // === Counterparty ===
      if (cursor + 80 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        cursor = doc.page.margins.top;
      } else {
        cursor += 18;
      }

      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
        .text("COUNTERPARTY — PDYE HOLDINGS", inner, cursor, { characterSpacing: 2.5 });
      cursor += 16;
      if (calligraphic) {
        doc.font("Calligraphic").fontSize(34).fillColor(NAVY).text("PDYE Holdings", inner, cursor);
      } else {
        doc.font("Times-Italic").fontSize(26).fillColor(NAVY).text("PDYE Holdings", inner, cursor);
      }
      cursor = doc.y + 4;
      doc.strokeColor(NAVY).lineWidth(0.4)
        .moveTo(inner, cursor).lineTo(blockLeft + blockWidth - 18, cursor).stroke();
      cursor += 6;
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
        .text("Pre-signed by the duly authorized representative of PDYE Holdings as facilitator of this Deal Room. Counterparty signature on file.", inner, cursor, { width: blockWidth - 36 });

      // Footer
      const pageRange = doc.bufferedPageRange();
      for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(pageRange.start + i);
        const footerY = doc.page.height - 36;
        doc.fillColor(MUTED).font("Helvetica").fontSize(7)
          .text(
            `PDYE — ${input.document.title} ${input.document.version}   ·   ${input.dealRef.deal_room_code}   ·   Signed by ${input.signature.user_email}   ·   Page ${i + 1} of ${pageRange.count}`,
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
