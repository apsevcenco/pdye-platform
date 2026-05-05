import { Router } from "express";
import { Resend } from "resend";
import { getSupabaseAdmin, requireAdmin } from "../middlewares/auth";

const router = Router();

function buildRejectionEmailHtml({
  name,
  yachtName,
  reason,
  siteUrl,
}: {
  name: string;
  yachtName: string;
  reason: string;
  siteUrl: string;
}): string {
  const greeting = name ? `Hello, ${name}.` : "Hello.";
  const reasonBlock = reason.trim()
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(200,164,107,0.06);border:1px solid rgba(200,164,107,0.25);margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:8px;">Reviewer Note</div>
              <div style="font-family:Georgia,serif;color:#ffffff;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(reason)}</div>
            </td></tr>
          </table>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PDYE — Access Request Update</title></head>
<body style="margin:0;padding:0;background:#070f1a;font-family:Georgia,serif;color:#e8e8e8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070f1a;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0a1426;border:1px solid rgba(200,164,107,0.25);">
        <tr><td style="padding:40px 48px 24px 48px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-family:Georgia,serif;letter-spacing:0.3em;color:#c8a46b;font-size:28px;font-weight:normal;">PDYE</div>
          <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-top:6px;">Private Distressed Yacht Exchange</div>
        </td></tr>
        <tr><td style="padding:40px 48px 24px 48px;">
          <h1 style="font-family:Georgia,serif;color:#ffffff;font-size:24px;font-weight:normal;margin:0 0 16px 0;">${greeting}</h1>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 12px 0;">
            We have reviewed your request to access <strong style="color:#c8a46b;">${escapeHtml(yachtName)}</strong>.
          </p>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 24px 0;">
            After careful consideration, your request was <strong style="color:#f87171;">not approved</strong> at this time.
          </p>
          ${reasonBlock}
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.7;margin:0 0 28px 0;">
            You are welcome to explore other listings or contact our team if you would like to discuss this decision.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;"><tr><td>
            <a href="${siteUrl}/#/yachts" style="display:inline-block;background:#c8a46b;color:#070f1a;font-family:Arial,sans-serif;font-weight:bold;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 36px;">Browse Fleet</a>
          </td></tr></table>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.6;margin:0;">
            This is an automated notification from the PDYE platform.
          </p>
        </td></tr>
        <tr><td style="padding:24px 48px 32px 48px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.3);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Confidential Brokerage</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// POST /api/access-requests/:id/reject
router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params["id"] || "").trim();
    if (!id) {
      res.status(400).json({ error: "Missing access request id" });
      return;
    }

    const reason = String(req.body?.reason || "").trim();
    const siteUrl =
      (req.body?.siteUrl as string | undefined) ||
      process.env["PUBLIC_SITE_URL"] ||
      "https://pdye-platform-1.onrender.com";

    const sb = getSupabaseAdmin();
    const adminId = req.authUser?.id || "";

    const { data: accessReq, error: reqErr } = await sb
      .from("access_requests")
      .select("id, yacht_id, requester_id, status")
      .eq("id", id)
      .maybeSingle();

    if (reqErr || !accessReq) {
      res.status(404).json({ error: "Access request not found" });
      return;
    }

    const now = new Date().toISOString();
    const { error: updErr } = await sb
      .from("access_requests")
      .update({
        status: "rejected",
        rejection_reason: reason || null,
        updated_at: now,
      })
      .eq("id", id);

    // If column rejection_reason doesn't exist yet, retry without it.
    if (
      updErr &&
      /column .* does not exist|Could not find the .* column/i.test(updErr.message)
    ) {
      console.warn(
        "[access-requests/reject] rejection_reason column missing, retrying without it:",
        updErr.message
      );
      const retry = await sb
        .from("access_requests")
        .update({ status: "rejected", updated_at: now })
        .eq("id", id);
      if (retry.error) {
        res.status(500).json({ error: "Failed to update request: " + retry.error.message });
        return;
      }
    } else if (updErr) {
      res.status(500).json({ error: "Failed to update request: " + updErr.message });
      return;
    }

    // Audit log (best-effort).
    try {
      await sb.from("audit_log").insert({
        entity_type: "access_request",
        entity_id: id,
        user_id: adminId,
        action: "access_request_rejected",
        meta: {
          yacht_id: accessReq.yacht_id,
          requester_id: accessReq.requester_id,
          reason: reason || null,
        },
      });
    } catch (e) {
      console.warn("[access-requests/reject] audit log insert failed:", (e as any)?.message);
    }

    // Look up requester email + name and yacht name for the notification.
    const [{ data: userRow }, { data: yachtRow }] = await Promise.all([
      sb
        .from("users")
        .select("email, name")
        .eq("id", accessReq.requester_id)
        .maybeSingle(),
      sb.from("yachts").select("name").eq("id", accessReq.yacht_id).maybeSingle(),
    ]);

    const recipientEmail = (userRow?.email || "").trim().toLowerCase();
    const recipientName = (userRow?.name as string | undefined) || "";
    const yachtName = (yachtRow?.name as string | undefined) || "the requested vessel";

    if (!recipientEmail) {
      res.json({
        success: true,
        emailed: false,
        warning: "Request rejected, but requester has no email on file.",
      });
      return;
    }

    const resendKey = process.env["RESEND_API_KEY"];
    if (!resendKey) {
      res.json({
        success: true,
        emailed: false,
        warning: "Request rejected, but RESEND_API_KEY is not configured.",
      });
      return;
    }

    const fromAddress =
      process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";
    const resend = new Resend(resendKey);

    const { data: mailData, error: mailErr } = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: "PDYE — Update on Your Access Request",
      html: buildRejectionEmailHtml({
        name: recipientName,
        yachtName,
        reason,
        siteUrl,
      }),
    });

    console.log(
      `[access-requests/reject] Resend → to=${recipientEmail} from=${fromAddress} id=${
        mailData?.id || "n/a"
      } err=${mailErr?.message || "none"}`
    );

    if (mailErr) {
      res.json({
        success: true,
        emailed: false,
        warning: "Request rejected, but email delivery failed: " + mailErr.message,
      });
      return;
    }

    res.json({ success: true, emailed: true, to: recipientEmail });
  } catch (err: any) {
    console.error("[POST /access-requests/:id/reject] error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

export default router;
