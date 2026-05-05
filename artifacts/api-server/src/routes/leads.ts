import { Router } from "express";
import { Resend } from "resend";
import { randomInt } from "crypto";
import { getSupabaseAdmin, requireAdmin } from "../middlewares/auth";
import { strictLimiter } from "../middlewares/rateLimit";

const router = Router();

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generatePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[randomInt(0, s.length)];
  const chars: string[] = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  for (let i = chars.length; i < length; i++) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

function mapYachtTypeToRole(yachtType: string): string {
  const t = (yachtType || "").toLowerCase();
  if (t.includes("broker")) return "broker";
  if (t.includes("owner")) return "owner";
  return "investor";
}

function roleLabel(role: string): string {
  if (role === "broker") return "Broker";
  if (role === "owner") return "Yacht Owner";
  if (role === "admin") return "Administrator";
  return "Private Buyer";
}

function buildEmailHtml({
  name,
  email,
  password,
  role,
  siteUrl,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
  siteUrl: string;
}): string {
  const label = roleLabel(role);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to PDYE</title></head>
<body style="margin:0;padding:0;background:#070f1a;font-family:Georgia,serif;color:#e8e8e8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070f1a;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0a1426;border:1px solid rgba(200,164,107,0.25);">
        <tr><td style="padding:40px 48px 24px 48px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-family:Georgia,serif;letter-spacing:0.3em;color:#c8a46b;font-size:28px;font-weight:normal;">PDYE</div>
          <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-top:6px;">Private Distressed Yacht Exchange</div>
        </td></tr>
        <tr><td style="padding:40px 48px 24px 48px;">
          <h1 style="font-family:Georgia,serif;color:#ffffff;font-size:24px;font-weight:normal;margin:0 0 16px 0;">Welcome${name ? ", " + escapeHtml(name) : ""}.</h1>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 12px 0;">
            Your application has been reviewed and approved. You now have access to the PDYE network as a <strong style="color:#c8a46b;">${escapeHtml(label)}</strong>.
          </p>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.55);font-size:13px;line-height:1.7;margin:0 0 28px 0;">
            Use the credentials below to sign in. We strongly recommend changing your password after your first login from your account settings.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(200,164,107,0.06);border:1px solid rgba(200,164,107,0.25);margin-bottom:28px;">
            <tr><td style="padding:24px;">
              <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:6px;">Email</div>
              <div style="font-family:'Courier New',monospace;color:#ffffff;font-size:15px;margin-bottom:18px;word-break:break-all;">${escapeHtml(email)}</div>
              <div style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:6px;">Temporary Password</div>
              <div style="font-family:'Courier New',monospace;color:#c8a46b;font-size:18px;letter-spacing:0.05em;font-weight:bold;">${password}</div>
            </td></tr>
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;"><tr><td>
            <a href="${siteUrl}/#/login" style="display:inline-block;background:#c8a46b;color:#070f1a;font-family:Arial,sans-serif;font-weight:bold;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:14px 36px;">Sign In</a>
          </td></tr></table>
          <p style="font-family:Arial,sans-serif;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.6;margin:0;">
            If you did not request access, please ignore this email or contact us immediately.
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

// GET /api/leads
router.get("/", requireAdmin, async (req, res) => {
  try {
    const sb = getSupabaseAdmin();

    const { data, error } = await sb
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data || []);
  } catch (err: any) {
    console.error("[GET /leads] error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// POST /api/leads/:id/approve
router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const leadId = String(req.params["id"] || "").trim();

    const isInt = /^\d+$/.test(leadId) && Number(leadId) > 0;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        leadId
      );

    if (!leadId || (!isInt && !isUuid)) {
      res.status(400).json({ error: "Invalid lead id" });
      return;
    }

    const overrideRole = (req.body?.role as string | undefined)?.trim();
    const siteUrl =
      (req.body?.siteUrl as string | undefined) ||
      process.env["PUBLIC_SITE_URL"] ||
      "https://pdye.app";

    const sb = getSupabaseAdmin();

    const { data: lead, error: leadErr } = await sb
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    const email = (lead.email || "").trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: "Lead has no email address" });
      return;
    }

    const role = overrideRole || mapYachtTypeToRole(lead.yacht_type || "");
    const password = generatePassword(12);

    const { data: existingList } = await sb.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    const existing = (
      existingList?.users as Array<{ id: string; email?: string | null }> | undefined
    )?.find((u) => (u.email || "").toLowerCase() === email);

    let authUserId: string;

    const richMeta: Record<string, any> = {
      name: lead.name || "",
      phone: lead.phone || "",
      company: lead.company || "",
      budget: lead.budget || "",
      yacht_type: lead.yacht_type || "",
      location: lead.location || "",
      notes: lead.message || "",
      source: "lead",
      lead_id: leadId,
    };

    if (existing) {
      const { error: updErr } = await sb.auth.admin.updateUserById(existing.id, {
        password,
        user_metadata: richMeta,
      });

      if (updErr) {
        res.status(500).json({
          error: "Failed to update existing user: " + updErr.message,
        });
        return;
      }

      authUserId = existing.id;
    } else {
      const { data: created, error: createErr } =
        await sb.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: richMeta,
        });

      if (createErr || !created.user) {
        res.status(500).json({
          error:
            "Failed to create auth user: " +
            (createErr?.message || "unknown"),
        });
        return;
      }

      authUserId = created.user.id;
    }

    const fullProfile: Record<string, any> = {
      id: authUserId,
      email,
      role,
      approved: true,
      name: lead.name || null,
      phone: lead.phone || null,
      company: lead.company || null,
      budget: lead.budget || null,
      yacht_type: lead.yacht_type || null,
      location: lead.location || null,
      notes: lead.message || null,
    };

    let { error: profErr } = await sb
      .from("users")
      .upsert(fullProfile, { onConflict: "id" });

    if (
      profErr &&
      /column .* does not exist|Could not find the .* column/i.test(
        profErr.message
      )
    ) {
      console.warn(
        "[approve] users table missing optional columns, retrying with base set:",
        profErr.message
      );

      const baseProfile = {
        id: authUserId,
        email,
        role,
        approved: true,
      };

      const retry = await sb
        .from("users")
        .upsert(baseProfile, { onConflict: "id" });

      profErr = retry.error;
    }

    if (profErr) {
      res.status(500).json({
        error: "Failed to create user profile: " + profErr.message,
      });
      return;
    }

    const resendKey = process.env["RESEND_API_KEY"];

    if (!resendKey) {
      res.status(500).json({ error: "RESEND_API_KEY is not configured" });
      return;
    }

    const fromAddress =
      process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";

    const resend = new Resend(resendKey);

    const { data: mailData, error: mailErr } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Welcome to PDYE — Your Access Credentials",
      html: buildEmailHtml({
        name: lead.name || "",
        email,
        password,
        role,
        siteUrl,
      }),
    });

    console.log(
      `[approve] Resend → to=${email} from=${fromAddress} id=${
        mailData?.id || "n/a"
      } err=${mailErr?.message || "none"}`
    );

    if (mailErr) {
      res.status(500).json({
        error: "Failed to send email: " + mailErr.message,
        hint: "User was created but email delivery failed. Check RESEND_API_KEY and RESEND_FROM_EMAIL.",
      });
      return;
    }

    await sb.from("leads").delete().eq("id", leadId);

    res.json({
      success: true,
      email,
      role,
      userId: authUserId,
    });
  } catch (err: any) {
    console.error("[POST /leads/:id/approve] error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

export default router;
