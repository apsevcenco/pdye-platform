import { Router, type Request, type Response } from "express";
import pg from "pg";
import crypto from "crypto";
import { requireUser, requireAdmin } from "../middlewares/auth";
import { requirePlatformNdaSigned } from "./platformNda";
import { getClientIp } from "../lib/legalFont";
import { generateDealLegalPdf } from "../lib/dealLegalPdf";
import { sendSignedDealLegalEmail } from "../lib/dealLegalEmail";
import { createClient } from "@supabase/supabase-js";

const router: Router = Router();

/* ─────────────────── Pool / migration ─────────────────── */

let pool: pg.Pool | null = null;
let migrationQueued = false;

function getPool(): pg.Pool {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return new pg.Pool({ connectionString: dbUrl, max: 5 });
}

function db(): pg.Pool {
  if (!pool) {
    pool = getPool();
    if (!migrationQueued) {
      migrationQueued = true;
      runMigration().catch(e => console.error("[deal-legal] migration error:", e));
    }
  }
  return pool;
}

const INITIAL_NDA_VERSION = "1.0";
const INITIAL_NDA_TITLE = "Deal Room Non-Disclosure & Terms of Access Agreement";

const INITIAL_NDA_CONTENT = `DEAL ROOM NON-DISCLOSURE & TERMS OF ACCESS AGREEMENT

This Agreement ("Agreement") is entered into by the undersigned party ("Receiving Party") and Private Distressed Yacht Exchange ("PDYE", the "Disclosing Party") as a condition of access to and use of a Deal Room operated on the PDYE platform.

PART I — NON-DISCLOSURE

1. CONFIDENTIAL INFORMATION
The Receiving Party agrees that all information regarding yacht listings, pricing, ownership details, broker identities, deal terms, and any other proprietary data shared through the PDYE platform constitutes Confidential Information.

2. OBLIGATIONS
The Receiving Party shall:
(a) Keep all Confidential Information strictly confidential;
(b) Not disclose any Confidential Information to third parties without prior written consent from PDYE;
(c) Use Confidential Information solely for the purpose of evaluating and potentially acquiring the vessel(s) presented;
(d) Not contact vessel owners, brokers, or other parties directly, bypassing the PDYE introduction process.

3. NON-CIRCUMVENTION
The Receiving Party agrees not to circumvent, avoid, bypass, or obviate PDYE, directly or indirectly, to avoid payment of fees or commissions in any transaction. This obligation survives for 24 months after the last disclosure of Confidential Information.

4. DURATION
This Agreement remains in effect for 24 months from the date of acceptance.

5. REMEDIES
The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm, and PDYE shall be entitled to seek injunctive relief in addition to any other remedies available at law.

PART II — TERMS OF ACCESS & NON-CIRCUMVENTION

6. PLATFORM ROLE
PDYE acts as the intermediary between buyers, brokers, and vessel owners. All introductions, communications, and transactions must be conducted through or with the knowledge of PDYE.

7. INTRODUCTION PROTECTION
Once an introduction has been made through PDYE:
(a) The introduction is permanently recorded and timestamped;
(b) Any subsequent transaction involving the introduced parties and/or vessel shall be deemed facilitated by PDYE;
(c) PDYE's commission rights are preserved regardless of the timeline of any eventual transaction.

8. PROHIBITED ACTIONS
You shall not:
(a) Contact any party introduced through PDYE outside of the platform;
(b) Share access credentials or deal room information with unauthorized parties;
(c) Attempt to negotiate directly with vessel owners or brokers without PDYE involvement;
(d) Copy, distribute, or store deal documentation outside of the platform.

9. COMMISSION STRUCTURE
PDYE earns a percentage of the broker's commission on completed transactions. Specific terms are agreed on a per-deal basis.

10. LIABILITY
PDYE provides information in good faith but does not guarantee the accuracy of vessel data, pricing, or condition reports. Independent verification is recommended.

11. TERMINATION
PDYE reserves the right to revoke Deal Room access at any time for breach of these Terms.

12. ACKNOWLEDGEMENT
By signing below, the Receiving Party confirms having read, understood, and agreed to be legally bound by all terms of this Agreement.`;

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

let migrationDone = false;
async function runMigration(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;
  const client = await db().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_nda_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        version text NOT NULL UNIQUE,
        title text NOT NULL,
        content text NOT NULL,
        content_hash text NOT NULL,
        is_active boolean NOT NULL DEFAULT false,
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS deal_nda_documents_one_active
        ON deal_nda_documents ((is_active)) WHERE is_active = true;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_nda_signatures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_room_id uuid NOT NULL,
        user_id uuid NOT NULL,
        side text NOT NULL,
        user_email text NOT NULL,
        signature_name text NOT NULL,
        accepted_read boolean NOT NULL DEFAULT false,
        accepted_understand boolean NOT NULL DEFAULT false,
        accepted_agree boolean NOT NULL DEFAULT false,
        document_id uuid NOT NULL REFERENCES deal_nda_documents(id),
        document_version text NOT NULL,
        document_hash text NOT NULL,
        ip text,
        user_agent text,
        signed_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    // Idempotent column additions for tables that pre-existed.
    await client.query(`ALTER TABLE deal_nda_signatures
      ADD COLUMN IF NOT EXISTS accepted_read boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE deal_nda_signatures
      ADD COLUMN IF NOT EXISTS accepted_understand boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE deal_nda_signatures
      ADD COLUMN IF NOT EXISTS accepted_agree boolean NOT NULL DEFAULT false`);
    // Idempotency guard: at most one signature per (room, user, side).
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS deal_nda_signatures_room_user_side_uniq
        ON deal_nda_signatures (deal_room_id, user_id, side);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS deal_nda_signatures_room_idx
        ON deal_nda_signatures (deal_room_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS deal_nda_signatures_user_idx
        ON deal_nda_signatures (user_id);
    `);
    // Seed initial v1.0 if no active document.
    const { rows: active } = await client.query(
      `SELECT 1 FROM deal_nda_documents WHERE is_active = true LIMIT 1`
    );
    if (active.length === 0) {
      const hash = sha256Hex(INITIAL_NDA_CONTENT);
      await client.query(
        `INSERT INTO deal_nda_documents (version, title, content, content_hash, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (version) DO NOTHING`,
        [INITIAL_NDA_VERSION, INITIAL_NDA_TITLE, INITIAL_NDA_CONTENT, hash]
      );
      console.log(`[deal-legal] Seeded initial Deal NDA v${INITIAL_NDA_VERSION} (hash=${hash.slice(0, 12)}…)`);
    }
    console.log(`[deal-legal] Migration complete`);
  } finally {
    client.release();
  }
}

/* ─────────────────── Helpers ─────────────────── */

function dealRoomCode(room: { id: string; room_number?: number | null }): string {
  if (room.room_number) return `DR-${String(room.room_number).padStart(6, "0")}`;
  return room.id.slice(0, 8).toUpperCase();
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
function supabaseAdmin() {
  if (supabaseClient) return supabaseClient;
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    console.warn("[deal-legal] Supabase env not set — user email lookup disabled");
    return null;
  }
  supabaseClient = createClient(url, key, { auth: { persistSession: false } });
  return supabaseClient;
}

async function lookupUserEmail(userId: string, fallback?: string | null): Promise<string> {
  if (fallback) return fallback;
  const sb = supabaseAdmin();
  if (!sb) return "";
  try {
    const { data } = await sb.auth.admin.getUserById(userId);
    return data?.user?.email || "";
  } catch (e) {
    console.warn(`[deal-legal] Could not look up user ${userId}:`, (e as Error).message);
    return "";
  }
}

/* ─────────────────── GET /deal-nda/document ─────────────────── */

router.get("/deal-nda/document", requireUser, async (_req, res) => {
  try {
    const { rows } = await db().query(
      `SELECT id, version, title, content, content_hash, created_at
         FROM deal_nda_documents
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1`
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "No active Deal NDA document configured" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[deal-legal] get document error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────── POST /deal-rooms/:id/nda/sign ─────────────────── */

router.post(
  "/deal-rooms/:id/nda/sign",
  requireUser,
  requirePlatformNdaSigned,
  async (req: Request, res: Response) => {
    const viewer = req.authUser!;
    const roomId = String(req.params.id);
    const {
      signature_name,
      accepted_read,
      accepted_understand,
      accepted_agree,
      document_id,
      content_hash,
    } = req.body || {};

    // Validation
    const trimmedName = typeof signature_name === "string" ? signature_name.trim() : "";
    if (trimmedName.length < 3) {
      res.status(400).json({ error: "Signature name must be at least 3 characters" });
      return;
    }
    if (!accepted_read || !accepted_understand || !accepted_agree) {
      res.status(400).json({ error: "All three acknowledgements are required" });
      return;
    }
    if (typeof document_id !== "string" || typeof content_hash !== "string") {
      res.status(400).json({ error: "document_id and content_hash are required" });
      return;
    }

    // Resolve the signer's email BEFORE opening the transaction — Supabase admin
    // is a network call and we don't want to hold the deal_room row lock on it.
    const userEmail = await lookupUserEmail(viewer.id, viewer.email || null);
    const ip = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);

    const client = await db().connect();
    let signatureId: string;
    let signedAtIso: string;
    let activated = false;
    let docVersion = "";
    let docForPdf: { id: string; version: string; title: string; content: string; content_hash: string } | null = null;
    let dealRefForPdf = { deal_room_id: roomId, deal_room_code: roomId.slice(0, 8).toUpperCase() };
    let sideForPdf: "buyer" | "seller" = "buyer";

    try {
      await client.query("BEGIN");

      // Lock the deal room row to serialize concurrent signing attempts.
      const { rows: roomRows } = await client.query(
        "SELECT * FROM deal_rooms WHERE id = $1 FOR UPDATE",
        [roomId]
      );
      if (roomRows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Deal room not found" });
        return;
      }
      const room = roomRows[0];

      let side: "buyer" | "seller";
      if (viewer.id === room.buyer_user_id) side = "buyer";
      else if (viewer.id === room.seller_user_id) side = "seller";
      else {
        await client.query("ROLLBACK");
        res.status(403).json({ error: "You are not a buyer or seller in this deal room" });
        return;
      }
      sideForPdf = side;

      // Verify the active document still matches caller's hash.
      const { rows: docRows } = await client.query(
        `SELECT id, version, title, content, content_hash
           FROM deal_nda_documents
          WHERE is_active = true
          ORDER BY created_at DESC
          LIMIT 1`
      );
      if (docRows.length === 0) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "No active Deal NDA document configured" });
        return;
      }
      const doc = docRows[0];
      if (doc.id !== document_id || doc.content_hash !== content_hash) {
        await client.query("ROLLBACK");
        res.status(409).json({
          error: "DEAL_NDA_VERSION_CHANGED",
          message: "The Deal NDA document has been updated. Please reload and review the new version before signing.",
          active_document_id: doc.id,
          active_version: doc.version,
          active_content_hash: doc.content_hash,
        });
        return;
      }
      docForPdf = doc;
      docVersion = doc.version;

      const sideStatusCol = side === "buyer" ? "buyer_nda_status" : "seller_nda_status";
      if (room[sideStatusCol] === "signed") {
        await client.query("ROLLBACK");
        res.status(409).json({ error: `You have already signed the NDA for this deal room` });
        return;
      }

      const signedAt = new Date();
      signedAtIso = signedAt.toISOString();

      // INSERT signature — UNIQUE(deal_room_id,user_id,side) prevents dupes on retry.
      const { rows: sigRows } = await client.query(
        `INSERT INTO deal_nda_signatures
           (deal_room_id, user_id, side, user_email, signature_name,
            accepted_read, accepted_understand, accepted_agree,
            document_id, document_version, document_hash, ip, user_agent, signed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (deal_room_id, user_id, side) DO NOTHING
         RETURNING id, signed_at`,
        [
          roomId, viewer.id, side, userEmail, trimmedName,
          !!accepted_read, !!accepted_understand, !!accepted_agree,
          doc.id, doc.version, doc.content_hash, ip, userAgent, signedAtIso,
        ]
      );
      if (sigRows.length === 0) {
        // Lost the race against a concurrent sign — fetch the existing one.
        const { rows: existing } = await client.query(
          `SELECT id, signed_at FROM deal_nda_signatures
            WHERE deal_room_id = $1 AND user_id = $2 AND side = $3 LIMIT 1`,
          [roomId, viewer.id, side]
        );
        await client.query("ROLLBACK");
        res.status(409).json({
          error: "ALREADY_SIGNED",
          message: "You have already signed the NDA for this deal room",
          signature_id: existing[0]?.id || null,
          signed_at: existing[0]?.signed_at || null,
        });
        return;
      }
      signatureId = sigRows[0].id;
      signedAtIso = sigRows[0].signed_at instanceof Date
        ? sigRows[0].signed_at.toISOString()
        : String(sigRows[0].signed_at);

      // UPDATE deal_rooms status (only flip if not already signed) — atomic flip.
      const sentCol = side === "buyer" ? "buyer_nda_sent_at" : "seller_nda_sent_at";
      const signedCol = side === "buyer" ? "buyer_nda_signed_at" : "seller_nda_signed_at";
      await client.query(
        `UPDATE deal_rooms
            SET ${sideStatusCol} = 'signed',
                ${signedCol} = $2,
                ${sentCol} = COALESCE(${sentCol}, $2),
                updated_at = now()
          WHERE id = $1
            AND ${sideStatusCol} <> 'signed'`,
        [roomId, signedAtIso]
      );

      // Insert nda_envelopes record (legacy compat).
      await client.query(
        `INSERT INTO nda_envelopes
           (deal_room_id, user_id, side, provider, status, sent_at, signed_at, completed_at, document_name)
         VALUES ($1, $2, $3, 'pdye-internal', 'signed', $4, $4, $4, $5)`,
        [roomId, viewer.id, side, signedAtIso, `${doc.title} v${doc.version}`]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
         VALUES ('deal_room', $1, $2, 'nda_signed', $3)`,
        [
          roomId, viewer.id,
          JSON.stringify({
            side,
            signature_id: signatureId,
            document_version: doc.version,
            document_hash: doc.content_hash,
            ip,
          }),
        ]
      );

      // System message in the deal room chat.
      await client.query(
        `INSERT INTO deal_room_messages (deal_room_id, sender_id, message, is_system)
         VALUES ($1, $2, $3, true)`,
        [
          roomId, viewer.id,
          `NDA signed by ${side} party (${trimmedName}) — v${doc.version}.`,
        ]
      );

      // Check whether both sides are now signed → activate room (still inside tx + lock).
      const { rows: refreshedRows } = await client.query(
        "SELECT * FROM deal_rooms WHERE id = $1",
        [roomId]
      );
      const refreshed = refreshedRows[0];
      dealRefForPdf = { deal_room_id: roomId, deal_room_code: dealRoomCode(refreshed) };

      if (
        refreshed.buyer_nda_status === "signed" &&
        refreshed.seller_nda_status === "signed" &&
        refreshed.status !== "active"
      ) {
        const activationRes = await client.query(
          `UPDATE deal_rooms
              SET status = 'active',
                  fully_activated_at = COALESCE(fully_activated_at, $2),
                  updated_at = now()
            WHERE id = $1
              AND status <> 'active'`,
          [roomId, signedAtIso]
        );
        // Only emit activation side-effects if WE flipped the status.
        if ((activationRes.rowCount ?? 0) > 0) {
          await client.query(
            `UPDATE deal_room_participants
                SET can_view = true, can_message = true, can_download = true
              WHERE deal_room_id = $1`,
            [roomId]
          );
          await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
             VALUES ('deal_room', $1, $2, 'deal_room_activated', $3)`,
            [
              roomId, viewer.id,
              JSON.stringify({ yacht_id: refreshed.yacht_id, activated_at: signedAtIso }),
            ]
          );
          await client.query(
            `INSERT INTO deal_room_messages (deal_room_id, sender_id, message, is_system)
             VALUES ($1, $2, 'Deal room activated after NDA completion by both parties. Full access is now available.', true)`,
            [roomId, viewer.id]
          );
          activated = true;
        }
      } else if (
        (refreshed.buyer_nda_status === "signed") !== (refreshed.seller_nda_status === "signed") &&
        refreshed.status === "draft"
      ) {
        await client.query(
          "UPDATE deal_rooms SET status = 'partially_signed', updated_at = now() WHERE id = $1",
          [roomId]
        );
      }

      await client.query("COMMIT");
    } catch (e: any) {
      try { await client.query("ROLLBACK"); } catch { /* swallow */ }
      console.error("[deal-legal] sign error:", e);
      res.status(500).json({ error: e.message });
      return;
    } finally {
      client.release();
    }

    // Fire-and-forget PDF + email — runs after the transaction has committed.
    if (userEmail && docForPdf) {
      const docSnap = docForPdf;
      const sigSnap = {
        signature_name: trimmedName,
        user_email: userEmail,
        signed_at: new Date(signedAtIso),
        ip,
        user_agent: userAgent || null,
        document_version: docSnap.version,
        document_hash: docSnap.content_hash,
        side: sideForPdf,
      };
      (async () => {
        try {
          const pdf = await generateDealLegalPdf({
            document: {
              title: docSnap.title,
              version: docSnap.version,
              content: docSnap.content,
              content_hash: docSnap.content_hash,
            },
            signature: sigSnap,
            dealRef: dealRefForPdf,
          });
          await sendSignedDealLegalEmail({
            toEmail: userEmail,
            signatureName: trimmedName,
            documentTitle: docSnap.title,
            documentVersion: docSnap.version,
            documentHash: docSnap.content_hash,
            dealRoomCode: dealRefForPdf.deal_room_code,
            side: sideForPdf,
            signedAt: sigSnap.signed_at,
            ip,
            userAgent,
            pdf,
          });
        } catch (err) {
          console.error(`[deal-legal] PDF/email failed for sig ${signatureId}:`, err);
        }
      })();
    } else if (!userEmail) {
      console.warn(`[deal-legal] No email for user ${viewer.id} — skipping PDF email`);
    }

    res.json({
      success: true,
      signature_id: signatureId,
      signed_at: signedAtIso,
      document_version: docVersion,
      activated,
    });
  }
);

/* ─────────────── GET /deal-rooms/:roomId/nda/signed-pdf?side= ─────────────── */

router.get(
  "/deal-rooms/:roomId/nda/signed-pdf",
  requireUser,
  async (req: Request, res: Response) => {
    try {
      const viewer = req.authUser!;
      const roomId = String(req.params.roomId);
      const side = String(req.query.side || "");
      if (!["buyer", "seller"].includes(side)) {
        res.status(400).json({ error: "side query param must be 'buyer' or 'seller'" });
        return;
      }

      const { rows: roomRows } = await db().query(
        "SELECT * FROM deal_rooms WHERE id = $1",
        [roomId]
      );
      if (roomRows.length === 0) { res.status(404).json({ error: "Deal room not found" }); return; }
      const room = roomRows[0];

      const isAdmin = viewer.role === "admin";
      const isParticipant = viewer.id === room.buyer_user_id || viewer.id === room.seller_user_id;
      if (!isAdmin && !isParticipant) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Find the most recent signature for this room+side.
      const { rows: sigRows } = await db().query(
        `SELECT s.*, d.title, d.content
           FROM deal_nda_signatures s
           JOIN deal_nda_documents d ON d.id = s.document_id
          WHERE s.deal_room_id = $1 AND s.side = $2
          ORDER BY s.signed_at DESC
          LIMIT 1`,
        [roomId, side]
      );
      if (sigRows.length === 0) {
        res.status(404).json({ error: "No signature found for that side" });
        return;
      }
      const sig = sigRows[0];

      const pdf = await generateDealLegalPdf({
        document: {
          title: sig.title,
          version: sig.document_version,
          content: sig.content,
          content_hash: sig.document_hash,
        },
        signature: {
          signature_name: sig.signature_name,
          user_email: sig.user_email,
          signed_at: sig.signed_at,
          ip: sig.ip,
          user_agent: sig.user_agent,
          document_version: sig.document_version,
          document_hash: sig.document_hash,
          side: sig.side,
        },
        dealRef: { deal_room_id: roomId, deal_room_code: dealRoomCode(room) },
      });

      const safeName = String(sig.signature_name).replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
      const filename = `PDYE-NDA-${dealRoomCode(room)}-${side}-${sig.document_version}-${safeName}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdf.length));
      res.end(pdf);
    } catch (e: any) {
      console.error("[deal-legal] signed-pdf error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/* ─────────────── Admin: get / publish Deal Room NDA template ─────────────── */

router.get("/admin/deal-nda", requireAdmin, async (_req, res) => {
  try {
    const { rows: active } = await db().query(
      `SELECT id, version, title, content, content_hash, is_active, created_at
         FROM deal_nda_documents
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1`
    );
    const { rows: history } = await db().query(
      `SELECT id, version, title, content_hash, is_active, created_at
         FROM deal_nda_documents
        ORDER BY created_at DESC`
    );
    res.json({
      active: active[0] || null,
      history,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/admin/deal-nda", requireAdmin, async (req, res) => {
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
      : INITIAL_NDA_TITLE;
    const hash = sha256Hex(trimmedContent);

    const client = await db().connect();
    try {
      await client.query("BEGIN");
      const exists = await client.query(
        "SELECT 1 FROM deal_nda_documents WHERE version = $1",
        [trimmedVersion]
      );
      if (exists.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({
          error: `Version "${trimmedVersion}" already exists. Choose a different label (e.g. v1.1, v2.0).`,
        });
        return;
      }
      await client.query("UPDATE deal_nda_documents SET is_active = false WHERE is_active = true");
      const { rows } = await client.query(
        `INSERT INTO deal_nda_documents (version, title, content, content_hash, is_active, created_by)
         VALUES ($1, $2, $3, $4, true, $5)
         RETURNING id, version, title, content_hash, is_active, created_at`,
        [trimmedVersion, trimmedTitle, trimmedContent, hash, req.authUser!.id]
      );
      await client.query("COMMIT");
      console.log(
        `[deal-legal] Admin ${req.authUser!.email} published new Deal NDA version: ${trimmedVersion}`
      );
      res.json(rows[0]);
    } catch (e: any) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e: any) {
    console.error("[admin/deal-nda PUT] error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────── Admin: list all signatures (optional inspection) ─────────────── */

router.get(
  "/admin/deal-nda/signatures",
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await db().query(
        `SELECT id, deal_room_id, user_id, side, user_email, signature_name,
                document_id, document_version, document_hash, ip, user_agent, signed_at
           FROM deal_nda_signatures
           ORDER BY signed_at DESC`
      );
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* ─────────────── Admin: download a specific signed Deal NDA PDF by signature ID ───────────────
   This is the audit-trail-correct download path. Unlike the participant
   `/deal-rooms/:roomId/nda/signed-pdf?side=...` endpoint (which always returns
   the most recent signature for that room+side), this endpoint resolves the
   exact signature row the admin clicked on, even if newer signatures exist.
*/
router.get(
  "/admin/deal-nda/signatures/:id/pdf",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const sigId = String(req.params.id);
      const { rows: sigRows } = await db().query(
        `SELECT s.*, d.title, d.content
           FROM deal_nda_signatures s
           JOIN deal_nda_documents d ON d.id = s.document_id
          WHERE s.id = $1`,
        [sigId]
      );
      if (sigRows.length === 0) {
        res.status(404).json({ error: "Signature not found" });
        return;
      }
      const sig = sigRows[0];

      const { rows: roomRows } = await db().query(
        "SELECT id, room_number FROM deal_rooms WHERE id = $1",
        [sig.deal_room_id]
      );
      const room = roomRows[0] || { id: sig.deal_room_id, room_number: null };

      const pdf = await generateDealLegalPdf({
        document: {
          title: sig.title,
          version: sig.document_version,
          content: sig.content,
          content_hash: sig.document_hash,
        },
        signature: {
          signature_name: sig.signature_name,
          user_email: sig.user_email,
          signed_at: sig.signed_at,
          ip: sig.ip,
          user_agent: sig.user_agent,
          document_version: sig.document_version,
          document_hash: sig.document_hash,
          side: sig.side,
        },
        dealRef: { deal_room_id: sig.deal_room_id, deal_room_code: dealRoomCode(room) },
      });

      const safeName = String(sig.signature_name).replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
      const filename = `PDYE-DealNDA-${dealRoomCode(room)}-${sig.side}-${sig.document_version}-${safeName}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdf.length));
      res.end(pdf);
    } catch (e: any) {
      console.error("[admin/deal-nda PDF by-id] error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

// Eagerly trigger pool init + migration on module load.
setImmediate(() => {
  try { db(); } catch (e) { console.error("[deal-legal] eager init failed:", e); }
});

export default router;
