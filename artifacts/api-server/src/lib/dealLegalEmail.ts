import { Resend } from "resend";
import { escapeHtml } from "./legalFont";

export interface SignedDealLegalEmailInput {
  toEmail: string;
  signatureName: string;
  documentTitle: string;
  documentVersion: string;
  documentHash: string;
  dealRoomCode: string;
  side: string;
  signedAt: Date | string;
  ip: string;
  userAgent: string;
  pdf: Buffer;
}

/**
 * Send a branded HTML email with the signed deal-room legal PDF attached.
 * No-op if RESEND_API_KEY is not configured (warns to console). Throws on Resend errors.
 */
export async function sendSignedDealLegalEmail(input: SignedDealLegalEmailInput): Promise<void> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.warn(`[deal-legal] RESEND_API_KEY not set — skipping email send for ${input.toEmail}`);
    return;
  }

  const fromAddress = process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";
  const resend = new Resend(resendKey);
  const safeName = input.signatureName.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
  const safeDoc = input.documentTitle.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 50);
  const filename = `PDYE-${safeDoc}-${input.dealRoomCode}-${input.documentVersion}-${safeName}.pdf`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a1426;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1426;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#070f1a;border:1px solid rgba(200,164,107,0.25);">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="font-size:11px;letter-spacing:3px;color:#c8a46b;text-transform:uppercase;">Private Distressed Yacht Exchange</div>
          <div style="margin-top:14px;font-size:22px;color:#ffffff;font-weight:300;">Your signed ${escapeHtml(input.documentTitle)}</div>
          <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.45);">Deal Room ${escapeHtml(input.dealRoomCode)}</div>
        </td></tr>
        <tr><td style="padding:0 32px 8px 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
          Hello ${escapeHtml(input.signatureName)},
        </td></tr>
        <tr><td style="padding:0 32px 16px 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
          Thank you for signing the ${escapeHtml(input.documentTitle)} for Deal Room <span style="font-family:monospace;">${escapeHtml(input.dealRoomCode)}</span> as the <strong style="color:#c8a46b;">${escapeHtml(input.side)}</strong> party. A countersigned copy of the agreement is attached to this email for your records.
        </td></tr>
        <tr><td style="padding:0 32px 8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(200,164,107,0.2);">
            <tr><td style="padding:16px 18px;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.7;">
              <div><span style="display:inline-block;width:140px;color:rgba(255,255,255,0.4);">Deal Room</span> ${escapeHtml(input.dealRoomCode)}</div>
              <div><span style="display:inline-block;width:140px;color:rgba(255,255,255,0.4);">Document version</span> ${escapeHtml(input.documentVersion)}</div>
              <div><span style="display:inline-block;width:140px;color:rgba(255,255,255,0.4);">Signed at (UTC)</span> ${new Date(input.signedAt).toISOString()}</div>
              <div><span style="display:inline-block;width:140px;color:rgba(255,255,255,0.4);">IP address</span> ${escapeHtml(input.ip || "—")}</div>
              <div><span style="display:inline-block;width:140px;color:rgba(255,255,255,0.4);">Document hash</span> <span style="font-family:monospace;font-size:10.5px;">${escapeHtml(input.documentHash.slice(0, 32))}…</span></div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px;color:rgba(255,255,255,0.4);font-size:11px;line-height:1.7;">
          PDYE Holdings · Confidential. The attached PDF is a legally binding electronic record of your signature under the EU eIDAS Regulation, the U.S. ESIGN Act / UETA, and equivalent laws.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: input.toEmail,
    subject: `Your signed ${input.documentTitle} — Deal Room ${input.dealRoomCode}`,
    html,
    attachments: [{ filename, content: input.pdf.toString("base64") }],
  });
  if (error) throw new Error(error.message);
  console.log(`[deal-legal] Emailed signed PDF to ${input.toEmail} (resend id=${data?.id || "n/a"})`);
}
