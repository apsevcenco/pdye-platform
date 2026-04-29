import { Router, type Request, type Response, type NextFunction } from "express";
import pg from "pg";
import { createHash } from "crypto";
import { Resend } from "resend";
import { requireUser, requireAdmin } from "../middlewares/auth";
import { generateNdaPdf } from "../lib/ndaPdf";

const router = Router();

const INITIAL_NDA_VERSION = "v1.0";
const INITIAL_NDA_TITLE = "PDYE Platform Non-Disclosure Agreement";
const INITIAL_NDA_TEXT = `PRIVATE DISTRESSED YACHT EXCHANGE (PDYE)
PLATFORM NON-DISCLOSURE AGREEMENT
Version 1.0

This Non-Disclosure Agreement ("Agreement") is entered into between the undersigned User ("Recipient") and PDYE Holdings ("Disclosing Party"), the operator of the Private Distressed Yacht Exchange platform ("Platform"). By signing this Agreement, the Recipient agrees to the terms set forth below as a condition of receiving access to the Platform and any information made available through it.

1. CONFIDENTIAL INFORMATION

"Confidential Information" means any non-public information disclosed by, or accessible through, the Platform, including without limitation:
   (a) Listings of distressed yachts, vessels, and marine assets, including specifications, photographs, geographic locations, condition reports, and pricing;
   (b) Identities of yacht owners, brokers, private buyers, investors, financial institutions, lenders, insurers, and any other Platform participants;
   (c) Communications, documents, due diligence materials, and transaction details exchanged within any Deal Room or otherwise through the Platform;
   (d) Valuation reports, market intelligence, distressed sale analytics, and any proprietary methodology or data provided by the Platform;
   (e) Commission structures, fee arrangements, financial terms, and economic details of any actual or potential transaction;
   (f) The existence, status, or terms of any potential or actual transaction facilitated through the Platform;
   (g) Any business, technical, or operational information of PDYE Holdings disclosed in the course of using the Platform.

2. RECIPIENT'S OBLIGATIONS

The Recipient agrees to:
   (a) Hold all Confidential Information in strict confidence and protect it with at least the same degree of care used to protect its own confidential information of comparable importance, and in any event no less than reasonable care;
   (b) Use Confidential Information solely for the purpose of evaluating, negotiating, and participating in transactions facilitated through the Platform;
   (c) Not disclose, reproduce, distribute, publish, transmit, or share Confidential Information with any third party without the prior written consent of PDYE Holdings;
   (d) Not use Confidential Information for personal benefit, competitive advantage, or any purpose outside of legitimate participation in the Platform;
   (e) Not retain copies, screenshots, downloads, exports, or derivatives of Confidential Information after access to the Platform is terminated, and to destroy or return all such materials upon request;
   (f) Take reasonable security measures to safeguard login credentials, devices, and information, and to promptly notify PDYE Holdings of any actual or suspected unauthorized access or disclosure;
   (g) Not attempt to identify, contact, or transact with any other Platform participant outside of the Platform with respect to any matter learned through the Platform.

3. EXCLUSIONS

Confidential Information does not include information that the Recipient can demonstrate:
   (a) Is or becomes publicly available through no fault, act, or omission of the Recipient;
   (b) Was lawfully known by the Recipient prior to disclosure by PDYE Holdings, without obligation of confidentiality;
   (c) Is independently developed by the Recipient without reference to or use of any Confidential Information;
   (d) Is required to be disclosed by applicable law, court order, or competent regulatory authority, provided that the Recipient gives PDYE Holdings prompt written notice and reasonable cooperation in seeking a protective order.

4. TERM

This Agreement is effective from the date of electronic signature and remains in force for a period of five (5) (five) years from the date of the Recipient's last access to the Platform. The obligations of confidentiality with respect to the identities of Platform participants and the details of any transaction shall survive indefinitely.

5. REMEDIES

The Recipient acknowledges that any breach of this Agreement may cause irreparable harm to PDYE Holdings and to other Platform participants, for which monetary damages alone may be inadequate. PDYE Holdings shall therefore be entitled to seek injunctive relief, specific performance, and any other equitable remedies, in addition to any other remedies available at law, without the requirement to post a bond.

6. NO LICENSE; OWNERSHIP

Nothing in this Agreement grants the Recipient any license, ownership interest, or other right in any Confidential Information, intellectual property, trademarks, software, or proprietary materials of PDYE Holdings, all of which are and remain the exclusive property of PDYE Holdings or its licensors.

7. NO WARRANTY

All Confidential Information is provided "AS IS" without warranty of any kind. PDYE Holdings makes no representation or warranty regarding the accuracy, completeness, or suitability of any information provided through the Platform.

8. GOVERNING LAW; JURISDICTION

This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction to be specified]. Any dispute arising out of or in connection with this Agreement shall be submitted to the exclusive jurisdiction of the competent courts of [Jurisdiction to be specified].

9. ENTIRE AGREEMENT; MODIFICATION

This Agreement, together with any other agreements expressly incorporated by reference, constitutes the entire understanding between the parties with respect to its subject matter and supersedes all prior or contemporaneous communications, whether written or oral. PDYE Holdings may publish updated versions of this Agreement; continued use of the Platform after notice of an updated version constitutes acceptance of the updated terms.

10. ELECTRONIC SIGNATURE

The Recipient agrees that the act of typing the Recipient's full name and clicking the "Sign Agreement" button constitutes a legally binding electronic signature under applicable electronic signature laws (including the EU eIDAS Regulation, the U.S. ESIGN Act and UETA, and equivalent laws in other jurisdictions), and has the same legal effect as a handwritten signature. The Recipient acknowledges that the date, time, IP address, user agent, document version, and document hash will be recorded as part of the signature record.

PDYE HOLDINGS
Signed on behalf of the company by the duly authorized representative of PDYE Holdings.
Pre-signed at platform inception. Counterparty signature on file.

RECIPIENT
By signing below, the Recipient acknowledges having read, understood, and agreed to be bound by all terms of this Agreement.`;

function getPool() {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return new pg.Pool({ connectionString: dbUrl, max: 5 });
}

let pool: pg.Pool | null = null;
let migrationQueued = false;
function db() {
  if (!pool) {
    pool = getPool();
    if (!migrationQueued) {
      migrationQueued = true;
      runMigration().catch(e => console.error("[platform-nda] Migration error:", e));
    }
  }
  return pool;
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

let migrationDone = false;
let migrationPromise: Promise<void> | null = null;
async function runMigration(): Promise<void> {
  if (migrationDone) return;
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const client = await db().connect();
    try {
      // Note: signed status is tracked via the platform_nda_signatures table (queried via /platform-nda/me).
      // The users table lives in Supabase (not in this DB), so we do not ALTER it here.

      await client.query(`
        CREATE TABLE IF NOT EXISTS platform_nda_documents (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          version text NOT NULL UNIQUE,
          title text NOT NULL DEFAULT 'PDYE Platform Non-Disclosure Agreement',
          content text NOT NULL,
          content_hash text NOT NULL,
          is_active boolean DEFAULT false,
          created_by uuid,
          created_at timestamptz DEFAULT now()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS platform_nda_signatures (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL,
          user_email text NOT NULL,
          signature_name text NOT NULL,
          document_id uuid NOT NULL,
          document_version text NOT NULL,
          document_hash text NOT NULL,
          ip text,
          user_agent text,
          signed_at timestamptz DEFAULT now()
        );
      `);

      // Helpful index for fast NDA-signed lookups in the gating middleware.
      await client.query(
        `CREATE INDEX IF NOT EXISTS platform_nda_signatures_user_id_idx ON platform_nda_signatures (user_id)`
      );

      // Concurrency-safe seed: ON CONFLICT DO NOTHING (version is UNIQUE).
      const hash = sha256(INITIAL_NDA_TEXT);
      await client.query(
        `INSERT INTO platform_nda_documents (version, title, content, content_hash, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (version) DO NOTHING`,
        [INITIAL_NDA_VERSION, INITIAL_NDA_TITLE, INITIAL_NDA_TEXT, hash]
      );

      migrationDone = true;
      console.log("[platform-nda] Migration complete");
    } finally {
      client.release();
    }
  })().catch(e => {
    // On failure, allow a future caller to retry.
    migrationPromise = null;
    throw e;
  });
  return migrationPromise;
}

/**
 * Express middleware that gates non-admin users behind a signed platform NDA.
 * MUST be chained AFTER requireUser (so req.authUser is populated).
 * Admins bypass automatically — they are considered pre-signed by policy.
 */
export async function requirePlatformNdaSigned(req: Request, res: Response, next: NextFunction): Promise<void> {
  const u = req.authUser;
  if (!u) { res.status(401).json({ error: "Authentication required" }); return; }
  if (u.role === "admin") { next(); return; }
  try {
    await runMigration().catch(() => { /* fall through; query below will fail clearly if tables missing */ });
    const { rows } = await db().query(
      "SELECT 1 FROM platform_nda_signatures WHERE user_id = $1 LIMIT 1",
      [u.id]
    );
    if (rows.length === 0) {
      res.status(403).json({ error: "Platform NDA must be signed before accessing this resource", code: "PLATFORM_NDA_NOT_SIGNED" });
      return;
    }
    next();
  } catch (e: any) {
    console.error("[requirePlatformNdaSigned] check failed:", e);
    res.status(500).json({ error: "NDA gate check failed" });
  }
}

function getClientIp(req: any): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.length > 0) return real.trim();
  return req.socket?.remoteAddress || "";
}

router.get("/platform-nda", requireUser, async (_req, res) => {
  try {
    const { rows } = await db().query(
      "SELECT id, version, title, content, content_hash, created_at FROM platform_nda_documents WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "No active NDA document configured" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/platform-nda/me", requireUser, async (req, res) => {
  try {
    const u = req.authUser!;
    const { rows } = await db().query(
      "SELECT id, signature_name, document_version, document_hash, signed_at FROM platform_nda_signatures WHERE user_id = $1 ORDER BY signed_at DESC LIMIT 1",
      [u.id]
    );
    res.json({
      signed: rows.length > 0,
      signature: rows[0] || null,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/platform-nda/sign", requireUser, async (req, res) => {
  try {
    const u = req.authUser!;
    const {
      signature_name,
      accepted_read,
      accepted_understand,
      accepted_agree,
      document_id: clientDocId,
      content_hash: clientHash,
    } = req.body || {};

    if (!signature_name || typeof signature_name !== "string" || signature_name.trim().length < 3) {
      res.status(400).json({ error: "Full name (signature) is required (minimum 3 characters)" });
      return;
    }
    if (!accepted_read || !accepted_understand || !accepted_agree) {
      res.status(400).json({ error: "All three consent acknowledgements must be accepted" });
      return;
    }

    const { rows: docRows } = await db().query(
      "SELECT id, version, content_hash FROM platform_nda_documents WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );
    if (docRows.length === 0) {
      res.status(500).json({ error: "No active NDA document configured" });
      return;
    }
    const doc = docRows[0];

    // Mid-session version-publish guard: if the client provided the doc id / content hash
    // they viewed, ensure those still match the currently active document. Otherwise the
    // admin published a new version while the user was on the page — they must re-load
    // and re-read the new text before signing.
    if (clientDocId && clientDocId !== doc.id) {
      res.status(409).json({
        error: "The agreement was updated while this page was open. Please reload to read the latest version before signing.",
        code: "PLATFORM_NDA_VERSION_CHANGED",
      });
      return;
    }
    if (clientHash && clientHash !== doc.content_hash) {
      res.status(409).json({
        error: "The agreement text changed while this page was open. Please reload to read the latest version before signing.",
        code: "PLATFORM_NDA_VERSION_CHANGED",
      });
      return;
    }

    const ip = getClientIp(req);
    const ua = (req.headers["user-agent"] as string) || "";

    const { rows: sigRows } = await db().query(
      `INSERT INTO platform_nda_signatures
        (user_id, user_email, signature_name, document_id, document_version, document_hash, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, signed_at`,
      [u.id, u.email, signature_name.trim(), doc.id, doc.version, doc.content_hash, ip, ua]
    );
    const sig = sigRows[0];

    console.log(`[platform-nda] User ${u.email} signed v${doc.version} from ${ip}`);

    // Fire-and-forget: generate PDF + email it. Failure must not break signing.
    sendSignedNdaEmail({
      signatureId: sig.id,
      signatureName: signature_name.trim(),
      userEmail: u.email,
      signedAt: sig.signed_at,
      ip,
      userAgent: ua,
      documentId: doc.id,
      documentVersion: doc.version,
      documentHash: doc.content_hash,
    }).catch(err => {
      console.error(`[platform-nda] Email delivery failed for signature ${sig.id}:`, err?.message || err);
    });

    res.json({
      success: true,
      signature_id: sig.id,
      signed_at: sig.signed_at,
      document_version: doc.version,
    });
  } catch (e: any) {
    console.error("[platform-nda/sign] error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/platform-nda", requireAdmin, async (_req, res) => {
  try {
    const { rows: active } = await db().query(
      "SELECT id, version, title, content, content_hash, is_active, created_at FROM platform_nda_documents WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
    );
    const { rows: history } = await db().query(
      "SELECT id, version, title, content_hash, is_active, created_at FROM platform_nda_documents ORDER BY created_at DESC"
    );
    res.json({
      active: active[0] || null,
      history,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/admin/platform-nda", requireAdmin, async (req, res) => {
  try {
    const { version, title, content } = req.body || {};
    if (!version || typeof version !== "string" || !version.trim()) {
      res.status(400).json({ error: "Version label is required" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length < 100) {
      res.status(400).json({ error: "Content is required (minimum 100 characters)" });
      return;
    }

    const trimmedVersion = version.trim();
    const trimmedContent = content.trim();
    const trimmedTitle = title && typeof title === "string" && title.trim()
      ? title.trim()
      : "PDYE Platform Non-Disclosure Agreement";
    const hash = sha256(trimmedContent);

    const client = await db().connect();
    try {
      await client.query("BEGIN");
      const exists = await client.query("SELECT 1 FROM platform_nda_documents WHERE version = $1", [trimmedVersion]);
      if (exists.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: `Version "${trimmedVersion}" already exists. Choose a different label (e.g. v1.1, v2.0).` });
        return;
      }
      await client.query("UPDATE platform_nda_documents SET is_active = false WHERE is_active = true");
      const { rows } = await client.query(
        `INSERT INTO platform_nda_documents (version, title, content, content_hash, is_active, created_by)
         VALUES ($1, $2, $3, $4, true, $5) RETURNING id, version, title, content_hash, is_active, created_at`,
        [trimmedVersion, trimmedTitle, trimmedContent, hash, req.authUser!.id]
      );
      await client.query("COMMIT");
      console.log(`[platform-nda] Admin ${req.authUser!.email} published new version: ${trimmedVersion}`);
      res.json(rows[0]);
    } catch (e: any) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e: any) {
    console.error("[admin/platform-nda PUT] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Build the signed-NDA payload (document + signature) used by both the PDF endpoint
// and the email sender.
async function fetchSignedPdfBuffer(signatureId: string): Promise<{ pdf: Buffer; userEmail: string; signatureName: string; documentVersion: string } | null> {
  const { rows: sigRows } = await db().query(
    `SELECT s.id, s.user_id, s.user_email, s.signature_name, s.document_id, s.document_version, s.document_hash,
            s.ip, s.user_agent, s.signed_at
     FROM platform_nda_signatures s WHERE s.id = $1`,
    [signatureId]
  );
  if (sigRows.length === 0) return null;
  const sig = sigRows[0];

  const { rows: docRows } = await db().query(
    `SELECT id, version, title, content, content_hash FROM platform_nda_documents WHERE id = $1`,
    [sig.document_id]
  );
  if (docRows.length === 0) return null;
  const doc = docRows[0];

  const pdf = await generateNdaPdf({
    document: {
      title: doc.title,
      version: doc.version,
      content: doc.content,
      content_hash: doc.content_hash,
    },
    signature: {
      signature_name: sig.signature_name,
      user_email: sig.user_email,
      signed_at: sig.signed_at,
      ip: sig.ip,
      user_agent: sig.user_agent,
      document_version: sig.document_version,
      document_hash: sig.document_hash,
    },
  });

  return {
    pdf,
    userEmail: sig.user_email,
    signatureName: sig.signature_name,
    documentVersion: sig.document_version,
  };
}

interface SignedNdaEmailInput {
  signatureId: string;
  signatureName: string;
  userEmail: string;
  signedAt: Date | string;
  ip: string;
  userAgent: string;
  documentId: string;
  documentVersion: string;
  documentHash: string;
}

async function sendSignedNdaEmail(input: SignedNdaEmailInput): Promise<void> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.warn("[platform-nda] RESEND_API_KEY not set — skipping email send for signature", input.signatureId);
    return;
  }
  const result = await fetchSignedPdfBuffer(input.signatureId);
  if (!result) {
    console.warn("[platform-nda] Could not build PDF for signature", input.signatureId);
    return;
  }

  const fromAddress = process.env["RESEND_FROM_EMAIL"] || "PDYE <onboarding@resend.dev>";
  const resend = new Resend(resendKey);
  const filename = `PDYE-NDA-${result.documentVersion}-${result.signatureName.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40)}.pdf`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a1426;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1426;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#070f1a;border:1px solid rgba(200,164,107,0.25);">
        <tr><td style="padding:32px 32px 16px 32px;">
          <div style="font-size:11px;letter-spacing:3px;color:#c8a46b;text-transform:uppercase;">Private Distressed Yacht Exchange</div>
          <div style="margin-top:14px;font-size:22px;color:#ffffff;font-weight:300;">Your signed Non-Disclosure Agreement</div>
        </td></tr>
        <tr><td style="padding:0 32px 8px 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
          Hello ${escapeHtml(result.signatureName)},
        </td></tr>
        <tr><td style="padding:0 32px 16px 32px;color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
          Thank you for signing the PDYE Platform Non-Disclosure Agreement. A countersigned copy of the agreement is attached to this email for your records.
        </td></tr>
        <tr><td style="padding:0 32px 8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(200,164,107,0.2);">
            <tr><td style="padding:16px 18px;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.7;">
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
    to: input.userEmail,
    subject: `Your signed PDYE Platform NDA — ${input.documentVersion}`,
    html,
    attachments: [{ filename, content: result.pdf.toString("base64") }],
  });
  if (error) throw new Error(error.message);
  console.log(`[platform-nda] Emailed signed PDF to ${input.userEmail} (resend id=${data?.id || "n/a"})`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c] as string));
}

// PDF download — accessible to the signer or to admins.
router.get("/platform-nda/signature/:id/pdf", requireUser, async (req, res) => {
  try {
    const u = req.authUser!;
    const sigId = String(req.params.id);
    const { rows } = await db().query(
      `SELECT user_id FROM platform_nda_signatures WHERE id = $1`,
      [sigId]
    );
    if (rows.length === 0) { res.status(404).json({ error: "Signature not found" }); return; }
    if (u.role !== "admin" && rows[0].user_id !== u.id) {
      res.status(403).json({ error: "You may only download your own signed NDA" });
      return;
    }
    const result = await fetchSignedPdfBuffer(sigId);
    if (!result) { res.status(404).json({ error: "Could not generate PDF" }); return; }
    const filename = `PDYE-NDA-${result.documentVersion}-${result.signatureName.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(result.pdf.length));
    res.end(result.pdf);
  } catch (e: any) {
    console.error("[platform-nda/signature/:id/pdf] error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/admin/platform-nda/signatures", requireAdmin, async (_req, res) => {
  try {
    // Note: the `users` table lives in Supabase, not in this database (heliumdb).
    // We rely solely on the user_id / user_email captured at signing time.
    const { rows } = await db().query(
      `SELECT id, user_id, user_email, signature_name, document_id, document_version, document_hash,
              ip, user_agent, signed_at
       FROM platform_nda_signatures
       ORDER BY signed_at DESC`
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE a single platform NDA signature row (admin only).
// Used to clean up "ghost" signatures left over after a user is deleted from
// Supabase but their signature row remained in heliumdb (which has no FK to
// the users table). Operates on the row's own UUID (not user_id) so it can
// remove orphans whose user_id no longer exists anywhere.
router.delete("/admin/platform-nda/signatures/:id", requireAdmin, async (req, res) => {
  try {
    const sigId = String(req.params.id || "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sigId)) {
      res.status(400).json({ error: "Invalid signature id" });
      return;
    }
    const r = await db().query(
      `DELETE FROM platform_nda_signatures WHERE id = $1 RETURNING id, user_id, user_email`,
      [sigId]
    );
    if (r.rowCount === 0) {
      res.status(404).json({ error: "Signature not found" });
      return;
    }
    res.json({ ok: true, deleted: r.rows[0] });
  } catch (e: any) {
    console.error("[platform-nda] delete signature error:", e?.message);
    res.status(500).json({ error: e.message });
  }
});

// Eagerly trigger pool init + migration on module load (deferred to next tick so DATABASE_URL is ready)
setImmediate(() => {
  try { db(); } catch (e) { console.error("[platform-nda] eager init failed:", e); }
});

export default router;
