import { Router, type Request, type Response, type NextFunction } from "express";
import pg from "pg";
import { createHash } from "crypto";
import { requireUser, requireAdmin } from "../middlewares/auth";

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

// Eagerly trigger pool init + migration on module load (deferred to next tick so DATABASE_URL is ready)
setImmediate(() => {
  try { db(); } catch (e) { console.error("[platform-nda] eager init failed:", e); }
});

export default router;
