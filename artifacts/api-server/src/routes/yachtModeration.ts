import { Router } from "express";
import { Resend } from "resend";
import { getSupabaseAdmin, requireUser, requireAdmin } from "../middlewares/auth";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c] as string));
}

function siteBase(_req: import("express").Request): string {
  // Only trust server-side env to build links in outbound emails — never accept from client body
  // (otherwise an attacker could inject phishing links into the moderation emails).
  const fromEnv = process.env["PUBLIC_SITE_URL"];
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return "https://pdye.app";
}

type YachtRow = {
  id: string;
  name: string | null;
  builder: string | null;
  length: string | null;
  year: string | null;
  type: string | null;
  location: string | null;
  price: string | null;
  owner_id: string | null;
  main_image: string | null;
  image: string | null;
  listing_status: string | null;
  listing_review_comment: string | null;
};

async function loadYacht(id: string): Promise<YachtRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("yachts")
    .select("id, name, builder, length, year, type, location, price, owner_id, main_image, image, listing_status, listing_review_comment")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as YachtRow | null) || null;
}

async function loadOwner(ownerId: string | null | undefined): Promise<{ email: string | null; name: string | null }> {
  if (!ownerId) return { email: null, name: null };
  const sb = getSupabaseAdmin();
  const { data: profile } = await sb
    .from("users")
    .select("email,name")
    .eq("id", ownerId)
    .maybeSingle();
  if (profile?.email) return { email: String(profile.email), name: (profile.name as string | null) || null };
  // Fallback to auth.admin
  try {
    const { data: au } = await sb.auth.admin.getUserById(ownerId);
    const email = au?.user?.email || null;
    const meta = (au?.user?.user_metadata || {}) as Record<string, any>;
    return { email, name: (meta.name as string | undefined) || null };
  } catch {
    return { email: null, name: null };
  }
}

function isMissingColumnError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42703" || err.code === "PGRST204") return true;
  if (err.message && /column .* does not exist/i.test(err.message)) return true;
  if (err.message && /could not find the .* column/i.test(err.message)) return true;
  return false;
}

const MIGRATION_HINT =
  "Database is not ready: the yacht-moderation columns are missing from the `yachts` table. " +
  "Run the SQL migration `artifacts/pdye/migrations/004_yacht_listing_status.sql` once in the " +
  "Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).";

/* ─────────────────── Email helpers ─────────────────── */

function shellHtml(inner: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a1426;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1426;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#070f1a;border:1px solid rgba(200,164,107,0.25);">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="font-size:11px;letter-spacing:3px;color:#c8a46b;text-transform:uppercase;">Private Distressed Yacht Exchange</div>
        </td></tr>
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function yachtCardHtml(yacht: YachtRow): string {
  const rows: Array<[string, string]> = [
    ["Name", yacht.name || "—"],
    ["Builder", yacht.builder || "—"],
    ["Length", yacht.length || "—"],
    ["Year", yacht.year || "—"],
    ["Type", yacht.type || "—"],
    ["Location", yacht.location || "—"],
    ["Asking price", yacht.price || "—"],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(200,164,107,0.2);margin-top:8px;">
    <tr><td style="padding:16px 18px;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.7;">
      ${rows.map(([k, v]) => `<div><span style="display:inline-block;width:120px;color:rgba(255,255,255,0.4);">${escapeHtml(k)}</span> ${escapeHtml(v)}</div>`).join("")}
    </td></tr>
  </table>`;
}

async function sendAdminSubmissionEmail(opts: {
  yacht: YachtRow;
  ownerEmail: string | null;
  ownerName: string | null;
  siteUrl: string;
}): Promise<void> {
  const adminEmail = process.env["ADMIN_NOTIFICATION_EMAIL"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!adminEmail) {
    console.warn("[yacht-moderation] ADMIN_NOTIFICATION_EMAIL not set — skipping admin alert");
    return;
  }
  if (!resendKey) {
    console.warn("[yacht-moderation] RESEND_API_KEY not set — skipping admin alert");
    return;
  }
  const fromAddress = process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";
  const reviewUrl = `${opts.siteUrl}/admin/yachts/${opts.yacht.id}`;
  const inner = `
    <tr><td style="padding:0 32px 8px 32px;color:#ffffff;font-size:20px;font-weight:300;">New listing awaits review</td></tr>
    <tr><td style="padding:8px 32px 0 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
      A ${escapeHtml(opts.ownerName ? "broker/owner — " + opts.ownerName : "user")}${opts.ownerEmail ? ` (${escapeHtml(opts.ownerEmail)})` : ""} just submitted a yacht listing for your approval.
    </td></tr>
    <tr><td style="padding:8px 32px 8px 32px;">${yachtCardHtml(opts.yacht)}</td></tr>
    <tr><td style="padding:16px 32px 32px 32px;">
      <a href="${reviewUrl}" style="display:inline-block;background:#c8a46b;color:#070f1a;font-weight:bold;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">Review Listing</a>
    </td></tr>`;
  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: adminEmail,
    subject: `New yacht listing awaits review — ${opts.yacht.name || "Untitled"}`,
    html: shellHtml(inner),
  });
  if (error) throw new Error(error.message);
  console.log(`[yacht-moderation] Admin notified: yacht=${opts.yacht.id} resend=${data?.id || "n/a"}`);
}

async function sendOwnerDecisionEmail(opts: {
  yacht: YachtRow;
  ownerEmail: string | null;
  ownerName: string | null;
  siteUrl: string;
  decision: "approved" | "rejected";
  comment?: string;
}): Promise<void> {
  if (!opts.ownerEmail) {
    console.warn(`[yacht-moderation] No owner email for yacht=${opts.yacht.id} — skipping ${opts.decision} email`);
    return;
  }
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.warn("[yacht-moderation] RESEND_API_KEY not set — skipping owner email");
    return;
  }
  const fromAddress = process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";
  const dashboardUrl = `${opts.siteUrl}/dashboard`;
  const editUrl = `${opts.siteUrl}/add-yacht?edit=${opts.yacht.id}`;
  const greeting = opts.ownerName ? `Hello ${escapeHtml(opts.ownerName)},` : "Hello,";

  let inner: string;
  let subject: string;

  if (opts.decision === "approved") {
    subject = `Your listing is live — ${opts.yacht.name || "Untitled"}`;
    inner = `
      <tr><td style="padding:0 32px 8px 32px;color:#ffffff;font-size:20px;font-weight:300;">Your listing has been approved</td></tr>
      <tr><td style="padding:8px 32px 0 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
        ${greeting}
      </td></tr>
      <tr><td style="padding:8px 32px 0 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
        Your yacht listing is now live in the PDYE catalogue. You can continue to edit it from your dashboard at any time — changes go live immediately, no further review required.
      </td></tr>
      <tr><td style="padding:8px 32px 8px 32px;">${yachtCardHtml(opts.yacht)}</td></tr>
      <tr><td style="padding:16px 32px 32px 32px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#c8a46b;color:#070f1a;font-weight:bold;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">Open Dashboard</a>
      </td></tr>`;
  } else {
    subject = `Your listing needs changes — ${opts.yacht.name || "Untitled"}`;
    const commentBlock = opts.comment
      ? `<tr><td style="padding:8px 32px 0 32px;">
           <div style="border-left:3px solid #c8a46b;background:rgba(200,164,107,0.06);padding:14px 18px;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(opts.comment)}</div>
         </td></tr>`
      : "";
    inner = `
      <tr><td style="padding:0 32px 8px 32px;color:#ffffff;font-size:20px;font-weight:300;">Listing review — changes requested</td></tr>
      <tr><td style="padding:8px 32px 0 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
        ${greeting}
      </td></tr>
      <tr><td style="padding:8px 32px 0 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
        Your yacht listing was reviewed and we have asked for changes before it can go live. Notes from our team:
      </td></tr>
      ${commentBlock}
      <tr><td style="padding:8px 32px 8px 32px;">${yachtCardHtml(opts.yacht)}</td></tr>
      <tr><td style="padding:16px 32px 32px 32px;">
        <a href="${editUrl}" style="display:inline-block;background:#c8a46b;color:#070f1a;font-weight:bold;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;padding:12px 28px;">Edit & Resubmit</a>
      </td></tr>`;
  }

  const resend = new Resend(resendKey);
  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: opts.ownerEmail,
    subject,
    html: shellHtml(inner),
  });
  if (error) throw new Error(error.message);
  console.log(`[yacht-moderation] Owner notified (${opts.decision}): yacht=${opts.yacht.id} to=${opts.ownerEmail} resend=${data?.id || "n/a"}`);
}

/* ─────────────────── Owner: submit for approval ─────────────────── */
//
// State machine:
//   draft     → pending  (owner submits)
//   rejected  → pending  (owner edits and resubmits)
//   pending   → approved (admin approves)
//   pending   → rejected (admin rejects with comment)
//   rejected  → approved (admin changes mind without owner resubmit)
//   approved  → (terminal — owner edits go live immediately, no further moderation)
//
// All state changes are guarded with conditional UPDATE … WHERE listing_status IN (allowed prior states)
// so concurrent operations cannot silently overwrite each other (TOCTOU). If 0 rows are returned
// from the conditional update, we re-read and return a 409 with the actual current state.

async function refusedStaleState(res: import("express").Response, yachtId: string, action: string) {
  const fresh = await loadYacht(yachtId);
  res.status(409).json({
    error: `Cannot ${action}: listing is currently in state "${fresh?.listing_status || "unknown"}". Refresh and try again.`,
    listing_status: fresh?.listing_status || null,
  });
}

router.post("/yachts/:id/submit", requireUser, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!UUID_RE.test(id)) { res.status(400).json({ error: "Invalid yacht id" }); return; }
    const u = req.authUser!;
    const sb = getSupabaseAdmin();

    const yacht = await loadYacht(id);
    if (!yacht) { res.status(404).json({ error: "Yacht not found" }); return; }
    if (yacht.owner_id !== u.id && u.role !== "admin") {
      res.status(403).json({ error: "You may only submit your own listings" });
      return;
    }

    // Conditional update — only flip to pending if currently draft or rejected (or NULL legacy).
    const { data: updated, error: updErr } = await sb.from("yachts").update({
      listing_status: "pending",
      listing_submitted_at: new Date().toISOString(),
      listing_review_comment: null,
      listing_reviewed_at: null,
      listing_reviewed_by: null,
    })
      .eq("id", id)
      .in("listing_status", ["draft", "rejected"])
      .select("id");

    if (updErr) {
      if (isMissingColumnError(updErr)) { res.status(500).json({ error: MIGRATION_HINT }); return; }
      res.status(500).json({ error: updErr.message });
      return;
    }
    if (!updated || updated.length === 0) {
      await refusedStaleState(res, id, "submit");
      return;
    }

    // Reload to get fresh status; then notify admin (best-effort, never fail the request)
    const fresh = (await loadYacht(id)) || yacht;
    const owner = await loadOwner(yacht.owner_id);
    try {
      await sendAdminSubmissionEmail({
        yacht: fresh,
        ownerEmail: owner.email,
        ownerName: owner.name,
        siteUrl: siteBase(req),
      });
    } catch (mailErr: any) {
      console.error("[yacht-moderation] admin email failed:", mailErr?.message || mailErr);
    }

    res.json({ ok: true, listing_status: "pending" });
  } catch (e: any) {
    console.error("[POST /yachts/:id/submit] error:", e);
    res.status(500).json({ error: e?.message || "Internal server error" });
  }
});

/* ─────────────────── Admin: approve ─────────────────── */

router.post("/admin/yachts/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!UUID_RE.test(id)) { res.status(400).json({ error: "Invalid yacht id" }); return; }
    const u = req.authUser!;
    const sb = getSupabaseAdmin();

    const yacht = await loadYacht(id);
    if (!yacht) { res.status(404).json({ error: "Yacht not found" }); return; }

    // Approve allowed only from pending or rejected (admin can override their own rejection).
    // Drafts MUST be submitted by the owner first — admin should not silently publish unsubmitted work.
    const { data: updated, error: updErr } = await sb.from("yachts").update({
      listing_status: "approved",
      listing_reviewed_at: new Date().toISOString(),
      listing_reviewed_by: u.id,
      listing_review_comment: null,
    })
      .eq("id", id)
      .in("listing_status", ["pending", "rejected"])
      .select("id");
    if (updErr) {
      if (isMissingColumnError(updErr)) { res.status(500).json({ error: MIGRATION_HINT }); return; }
      res.status(500).json({ error: updErr.message });
      return;
    }
    if (!updated || updated.length === 0) {
      await refusedStaleState(res, id, "approve");
      return;
    }

    const fresh = (await loadYacht(id)) || yacht;
    const owner = await loadOwner(yacht.owner_id);
    try {
      await sendOwnerDecisionEmail({
        yacht: fresh,
        ownerEmail: owner.email,
        ownerName: owner.name,
        siteUrl: siteBase(req),
        decision: "approved",
      });
    } catch (mailErr: any) {
      console.error("[yacht-moderation] owner approval email failed:", mailErr?.message || mailErr);
    }

    res.json({ ok: true, listing_status: "approved" });
  } catch (e: any) {
    console.error("[POST /admin/yachts/:id/approve] error:", e);
    res.status(500).json({ error: e?.message || "Internal server error" });
  }
});

/* ─────────────────── Admin: reject ─────────────────── */

router.post("/admin/yachts/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "");
    if (!UUID_RE.test(id)) { res.status(400).json({ error: "Invalid yacht id" }); return; }
    const comment = String(req.body?.comment || "").trim();
    if (!comment) { res.status(400).json({ error: "A comment is required when rejecting a listing" }); return; }
    if (comment.length > 4000) { res.status(400).json({ error: "Comment is too long (max 4000 chars)" }); return; }
    const u = req.authUser!;
    const sb = getSupabaseAdmin();

    const yacht = await loadYacht(id);
    if (!yacht) { res.status(404).json({ error: "Yacht not found" }); return; }

    // Reject is only meaningful for listings currently awaiting review.
    // Once a listing is approved, the user owns the lifecycle (edits go live immediately) —
    // taking it down requires deleting the listing, not retro-rejecting it.
    const { data: updated, error: updErr } = await sb.from("yachts").update({
      listing_status: "rejected",
      listing_reviewed_at: new Date().toISOString(),
      listing_reviewed_by: u.id,
      listing_review_comment: comment,
    })
      .eq("id", id)
      .eq("listing_status", "pending")
      .select("id");
    if (updErr) {
      if (isMissingColumnError(updErr)) { res.status(500).json({ error: MIGRATION_HINT }); return; }
      res.status(500).json({ error: updErr.message });
      return;
    }
    if (!updated || updated.length === 0) {
      await refusedStaleState(res, id, "reject");
      return;
    }

    const fresh = (await loadYacht(id)) || yacht;
    const owner = await loadOwner(yacht.owner_id);
    try {
      await sendOwnerDecisionEmail({
        yacht: fresh,
        ownerEmail: owner.email,
        ownerName: owner.name,
        siteUrl: siteBase(req),
        decision: "rejected",
        comment,
      });
    } catch (mailErr: any) {
      console.error("[yacht-moderation] owner rejection email failed:", mailErr?.message || mailErr);
    }

    res.json({ ok: true, listing_status: "rejected" });
  } catch (e: any) {
    console.error("[POST /admin/yachts/:id/reject] error:", e);
    res.status(500).json({ error: e?.message || "Internal server error" });
  }
});

export default router;
