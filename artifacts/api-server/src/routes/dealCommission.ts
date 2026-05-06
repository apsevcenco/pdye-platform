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
      runMigration().catch(e => console.error("[deal-commission] migration error:", e));
    }
  }
  return pool;
}

const INITIAL_COMMISSION_VERSION = "1.0";
const INITIAL_COMMISSION_TITLE = "Deal Room Commission Agreement";

const INITIAL_COMMISSION_CONTENT = `DEAL ROOM COMMISSION AGREEMENT

This Commission Agreement ("Agreement") is entered into by the undersigned party ("Party") and Private Distressed Yacht Exchange ("PDYE") with respect to the brokerage and advisory services rendered by PDYE in connection with the transaction facilitated through the PDYE Deal Room.

1. SCOPE
This Agreement governs the commission, fees, and economic terms applicable to the transaction conducted through the Deal Room to which the undersigned Party has been admitted. It supplements and operates in conjunction with the Deal Room Confidentiality & Non-Circumvention & Terms of Access Agreement previously executed by the Party.

2. INTRODUCTION & EXCLUSIVITY
The Party acknowledges that PDYE is the introducing intermediary for this transaction. PDYE has performed sourcing, identity verification, vessel due diligence, and counterparty matching services that constitute material consideration for the commission described below.

3. COMMISSION RATE
Unless otherwise agreed in writing in a side letter or in the Deal Room intake brief, PDYE's commission shall be a percentage of the gross transaction value (the "Commission") payable in immediately available funds at closing.
(a) The default Commission rate is set at 1.50% of the gross purchase price for the buy-side party and 1.50% of the gross purchase price for the sell-side party, for a combined total of 3.00%, unless adjusted in the Deal Room intake brief.
(b) Where the Party is represented by an outside broker that is also active in the Deal Room, PDYE's Commission may be structured as a co-brokerage split agreed in writing prior to signing of the purchase agreement.
(c) Specific deal-by-deal terms, when they differ from the defaults above, are recorded in the Deal Room intake brief and accepted by the Party upon entry into the Deal Room.

4. PAYMENT MECHANICS
The Commission is earned upon execution of a binding purchase and sale agreement between the parties introduced through the Deal Room and is due and payable at closing. The Party authorises the closing agent, escrow agent, or transaction counsel to disburse PDYE's Commission directly from closing proceeds in accordance with PDYE's wire instructions, prior to release of net proceeds to the Party.

5. SUCCESS FEE PROTECTION
PDYE's right to the Commission attaches at the moment a binding purchase agreement is executed, regardless of whether the closing is subsequently restructured, novated, assigned to an affiliate, deferred, or split into separate tranches. Any restructuring undertaken with the effect of avoiding or reducing PDYE's Commission shall be deemed a circumvention under Section 6.

6. NON-CIRCUMVENTION
The Party shall not, directly or indirectly, through affiliates, nominees, intermediaries, or representatives:
(a) approach, transact with, or contract with any counterparty introduced through the Deal Room outside the platform;
(b) restructure, defer, novate, or fragment the transaction with the effect of reducing or extinguishing PDYE's Commission;
(c) cause the Commission to be paid to any party other than PDYE.
This non-circumvention obligation survives for thirty-six (36) months from the date of introduction.

7. TAX & DEDUCTIONS
The Commission is stated net of taxes. Any value-added tax, withholding tax, or other transactional levy required by applicable law shall be added to and paid together with the Commission. The Party shall not deduct, set off, or withhold any amount from the Commission except as expressly required by law.

8. EXPENSES
Each party bears its own legal, advisory, due-diligence, and transactional expenses. PDYE may, at its option, invoice the Party for documented out-of-pocket expenses incurred at the Party's request (e.g. third-party survey, escrow set-up, jurisdiction-specific filings); such expenses shall be itemised and pre-approved by the Party.

9. DISPUTE RESOLUTION
Any dispute arising out of or in connection with this Agreement shall be resolved by confidential binding arbitration seated in London under the LCIA Rules then in force, by a sole arbitrator. The language of the arbitration shall be English. Pending resolution, each party shall continue to perform its obligations under this Agreement.

10. GOVERNING LAW
This Agreement is governed by, and construed in accordance with, the laws of England and Wales, without regard to conflict-of-laws principles.

11. ENTIRE AGREEMENT; AMENDMENTS
This Agreement, together with the Deal Room intake brief and the Deal Room Confidentiality & Non-Circumvention & Terms of Access Agreement, constitutes the entire agreement between the Party and PDYE concerning the commission economics of this transaction. Any amendment must be in writing and signed by both parties (electronic signature accepted).

12. ACKNOWLEDGEMENT
By signing below, the Party confirms having read, understood, and agreed to be legally bound by all terms of this Agreement, and authorises the disbursement of the Commission to PDYE at closing in accordance with Section 4.`;

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

type Audience = "broker" | "owner";
const AUDIENCES: Audience[] = ["broker", "owner"];

function normalizeAudience(v: unknown): Audience {
  return v === "owner" ? "owner" : "broker";
}

let migrationDone = false;
async function runMigration(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;
  const client = await db().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_commission_documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        version text NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        content_hash text NOT NULL,
        is_active boolean NOT NULL DEFAULT false,
        created_by uuid,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    // Add audience column for dual templates (broker / owner). Default 'broker' so
    // any pre-existing rows get backfilled correctly.
    await client.query(`
      ALTER TABLE deal_commission_documents
        ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'broker';
    `);
    // The legacy schema put a column-level UNIQUE on version; drop it so two
    // audiences can share a version label like "1.0".
    await client.query(`
      ALTER TABLE deal_commission_documents
        DROP CONSTRAINT IF EXISTS deal_commission_documents_version_key;
    `);
    // Composite unique on (version, audience).
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS deal_commission_documents_version_audience_uniq
        ON deal_commission_documents (version, audience);
    `);
    // Replace legacy single-active index with one active per audience.
    await client.query(`DROP INDEX IF EXISTS deal_commission_documents_one_active;`);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS deal_commission_documents_one_active_per_audience
        ON deal_commission_documents (audience) WHERE is_active = true;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_commission_signatures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_room_id uuid NOT NULL,
        user_id uuid NOT NULL,
        side text NOT NULL,
        user_email text NOT NULL,
        signature_name text NOT NULL,
        accepted_read boolean NOT NULL DEFAULT false,
        accepted_understand boolean NOT NULL DEFAULT false,
        accepted_agree boolean NOT NULL DEFAULT false,
        document_id uuid NOT NULL REFERENCES deal_commission_documents(id),
        document_version text NOT NULL,
        document_hash text NOT NULL,
        ip text,
        user_agent text,
        signed_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS deal_commission_signatures_room_user_side_uniq
        ON deal_commission_signatures (deal_room_id, user_id, side);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS deal_commission_signatures_room_idx
        ON deal_commission_signatures (deal_room_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS deal_commission_signatures_user_idx
        ON deal_commission_signatures (user_id);
    `);
    // Seed initial v1.0 per audience if missing. Owner template starts as a clone
    // of the broker content — admin edits the commission % afterwards.
    for (const audience of AUDIENCES) {
      const { rows: active } = await client.query(
        `SELECT 1 FROM deal_commission_documents WHERE is_active = true AND audience = $1 LIMIT 1`,
        [audience]
      );
      if (active.length === 0) {
        const title =
          audience === "owner"
            ? `${INITIAL_COMMISSION_TITLE} (Owner)`
            : INITIAL_COMMISSION_TITLE;
        const content =
          audience === "owner"
            ? `${INITIAL_COMMISSION_CONTENT}\n\n[Note: This is the OWNER-side template. Admin should edit the commission percentages in Section 3 to reflect the agreed owner-direct rate.]`
            : INITIAL_COMMISSION_CONTENT;
        const hash = sha256Hex(content);
        await client.query(
          `INSERT INTO deal_commission_documents (version, title, content, content_hash, is_active, audience)
           VALUES ($1, $2, $3, $4, true, $5)
           ON CONFLICT (version, audience) DO NOTHING`,
          [INITIAL_COMMISSION_VERSION, title, content, hash, audience]
        );
        console.log(`[deal-commission] Seeded ${audience} v${INITIAL_COMMISSION_VERSION} (hash=${hash.slice(0, 12)}…)`);
      }
    }
    console.log(`[deal-commission] Migration complete`);
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
    console.warn("[deal-commission] Supabase env not set — user email lookup disabled");
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
    console.warn(`[deal-commission] Could not look up user ${userId}:`, (e as Error).message);
    return "";
  }
}

async function lookupUserRole(userId: string): Promise<string> {
  const sb = supabaseAdmin();
  if (!sb) return "broker";
  try {
    const { data } = await sb
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    return ((data as { role?: string } | null)?.role) || "broker";
  } catch (e) {
    console.warn(`[deal-commission] Could not look up role for ${userId}:`, (e as Error).message);
    return "broker";
  }
}

function audienceForRole(role: string): Audience {
  return role === "owner" ? "owner" : "broker";
}

async function resolveAudienceForRoom(
  client: pg.PoolClient | pg.Pool,
  roomId: string
): Promise<Audience> {
  const { rows } = await client.query(
    "SELECT seller_user_id FROM deal_rooms WHERE id = $1",
    [roomId]
  );
  if (rows.length === 0 || !rows[0].seller_user_id) return "broker";
  const role = await lookupUserRole(String(rows[0].seller_user_id));
  return audienceForRole(role);
}

/* ─────────────────── GET /deal-commission/document ─────────────────── */

router.get("/deal-commission/document", requireUser, async (req, res) => {
  try {
    let audience: Audience;
    const roomIdParam = typeof req.query.roomId === "string" ? req.query.roomId : "";
    const audienceParam = typeof req.query.audience === "string" ? req.query.audience : "";
    if (roomIdParam) {
      audience = await resolveAudienceForRoom(db(), roomIdParam);
    } else if (audienceParam) {
      audience = normalizeAudience(audienceParam);
    } else {
      audience = "broker";
    }
    const { rows } = await db().query(
      `SELECT id, version, title, content, content_hash, audience, created_at
         FROM deal_commission_documents
        WHERE is_active = true AND audience = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [audience]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: `No active ${audience} Commission Agreement document configured` });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[deal-commission] get document error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────────── POST /deal-rooms/:id/commission/sign ─────────────────── */

router.post(
  "/deal-rooms/:id/commission/sign",
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

    // Resolve signer email outside the tx — Supabase admin is a network call.
    const userEmail = await lookupUserEmail(viewer.id, viewer.email || null);
    const ip = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);

    const client = await db().connect();
    let signatureId: string;
    let signedAtIso: string;
    let bothSigned = false;
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

      // The admin must have initiated the commission flow.
      if (room.commission_status !== "pending") {
        await client.query("ROLLBACK");
        res.status(409).json({
          error: `Commission is not pending (status: ${room.commission_status || "not_started"})`,
        });
        return;
      }

      // Verify the active document for THIS room's audience still matches caller's hash.
      const audience = await resolveAudienceForRoom(client, roomId);
      const { rows: docRows } = await client.query(
        `SELECT id, version, title, content, content_hash, audience
           FROM deal_commission_documents
          WHERE is_active = true AND audience = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [audience]
      );
      if (docRows.length === 0) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "No active Commission Agreement document configured" });
        return;
      }
      const doc = docRows[0];
      if (doc.id !== document_id || doc.content_hash !== content_hash) {
        await client.query("ROLLBACK");
        res.status(409).json({
          error: "DEAL_COMMISSION_VERSION_CHANGED",
          message: "The Commission Agreement has been updated. Please reload and review the new version before signing.",
          active_document_id: doc.id,
          active_version: doc.version,
          active_content_hash: doc.content_hash,
        });
        return;
      }
      docForPdf = doc;
      docVersion = doc.version;

      const sideStatusCol = side === "buyer" ? "buyer_commission_status" : "seller_commission_status";
      if (room[sideStatusCol] === "signed") {
        await client.query("ROLLBACK");
        res.status(409).json({ error: `You have already signed the Commission Agreement for this deal room` });
        return;
      }

      const signedAt = new Date();
      signedAtIso = signedAt.toISOString();

      // INSERT signature — UNIQUE(deal_room_id,user_id,side) prevents dupes on retry.
      const { rows: sigRows } = await client.query(
        `INSERT INTO deal_commission_signatures
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
        const { rows: existing } = await client.query(
          `SELECT id, signed_at FROM deal_commission_signatures
            WHERE deal_room_id = $1 AND user_id = $2 AND side = $3 LIMIT 1`,
          [roomId, viewer.id, side]
        );
        await client.query("ROLLBACK");
        res.status(409).json({
          error: "ALREADY_SIGNED",
          message: "You have already signed the Commission Agreement for this deal room",
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
      const signedCol = side === "buyer" ? "buyer_commission_signed_at" : "seller_commission_signed_at";
      await client.query(
        `UPDATE deal_rooms
            SET ${sideStatusCol} = 'signed',
                ${signedCol} = $2,
                updated_at = now()
          WHERE id = $1
            AND ${sideStatusCol} <> 'signed'`,
        [roomId, signedAtIso]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
         VALUES ('deal_room', $1, $2, 'commission_signed', $3)`,
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
          `Commission Agreement signed by ${side} party (${trimmedName}) — v${doc.version}.`,
        ]
      );

      // Both sides signed → mark commission completed + reveal identities (still inside tx + lock).
      const { rows: refreshedRows } = await client.query(
        "SELECT * FROM deal_rooms WHERE id = $1",
        [roomId]
      );
      const refreshed = refreshedRows[0];
      dealRefForPdf = { deal_room_id: roomId, deal_room_code: dealRoomCode(refreshed) };

      if (
        refreshed.buyer_commission_status === "signed" &&
        refreshed.seller_commission_status === "signed" &&
        !refreshed.commission_fully_signed_at
      ) {
        const completionRes = await client.query(
          `UPDATE deal_rooms
              SET commission_status = 'completed',
                  commission_fully_signed_at = $2,
                  identities_revealed = true,
                  updated_at = now()
            WHERE id = $1
              AND commission_fully_signed_at IS NULL`,
          [roomId, signedAtIso]
        );
        if ((completionRes.rowCount ?? 0) > 0) {
          await client.query(
            `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
             VALUES ('deal_room', $1, $2, 'commission_completed', $3)`,
            [
              roomId, viewer.id,
              JSON.stringify({ completed_at: signedAtIso, identities_revealed: true }),
            ]
          );
          await client.query(
            `INSERT INTO deal_room_messages (deal_room_id, sender_id, message, is_system)
             VALUES ($1, $2, 'Commission Agreement signed by both parties. Counterparty identities, vessel name, and location are now disclosed.', true)`,
            [roomId, viewer.id]
          );
          // Unlock identity / yacht_name / location blocks (same as legacy flow).
          for (const bk of ["identities", "yacht_name", "location"]) {
            await client.query(
              `INSERT INTO deal_room_blocks (deal_room_id, block_key, is_unlocked, unlocked_by, unlocked_at)
               VALUES ($1, $2, true, $3, now())
               ON CONFLICT (deal_room_id, block_key) DO UPDATE SET is_unlocked = true, unlocked_by = $3, unlocked_at = now()`,
              [roomId, bk, viewer.id]
            );
          }
          bothSigned = true;
        }
      }

      await client.query("COMMIT");
    } catch (e: any) {
      try { await client.query("ROLLBACK"); } catch { /* swallow */ }
      console.error("[deal-commission] sign error:", e);
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
          console.error(`[deal-commission] PDF/email failed for sig ${signatureId}:`, err);
        }
      })();
    } else if (!userEmail) {
      console.warn(`[deal-commission] No email for user ${viewer.id} — skipping PDF email`);
    }

    res.json({
      success: true,
      signature_id: signatureId,
      signed_at: signedAtIso,
      document_version: docVersion,
      both_signed: bothSigned,
    });
  }
);

/* ─────────────── GET /deal-rooms/:roomId/commission/signed-pdf?side= ─────────────── */

router.get(
  "/deal-rooms/:roomId/commission/signed-pdf",
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

      // A participant may only download their own side's signed PDF.
      // Only admins may pull either side (e.g. for compliance / audit).
      const isAdmin = viewer.role === "admin";
      const isOwnSide =
        (side === "buyer" && viewer.id === room.buyer_user_id) ||
        (side === "seller" && viewer.id === room.seller_user_id);
      if (!isAdmin && !isOwnSide) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const { rows: sigRows } = await db().query(
        `SELECT s.*, d.title, d.content
           FROM deal_commission_signatures s
           JOIN deal_commission_documents d ON d.id = s.document_id
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
      const filename = `PDYE-Commission-${dealRoomCode(room)}-${side}-${sig.document_version}-${safeName}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdf.length));
      res.end(pdf);
    } catch (e: any) {
      console.error("[deal-commission] signed-pdf error:", e);
      res.status(500).json({ error: e.message });
    }
  }
);

/* ─────────────── Admin: read active document + history ─────────────── */

router.get("/admin/deal-commission", requireAdmin, async (_req, res) => {
  try {
    const { rows: actives } = await db().query(
      `SELECT id, version, title, content, content_hash, audience, created_at, created_by
         FROM deal_commission_documents
        WHERE is_active = true`
    );
    const { rows: history } = await db().query(
      `SELECT id, version, title, content_hash, is_active, audience, created_at, created_by
         FROM deal_commission_documents
        ORDER BY created_at DESC`
    );
    const bundleFor = (audience: Audience) => ({
      active: actives.find(a => a.audience === audience) || null,
      history: history.filter(h => h.audience === audience),
    });
    res.json({
      broker: bundleFor("broker"),
      owner: bundleFor("owner"),
    });
  } catch (e: any) {
    console.error("[deal-commission] admin get error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ─────────────── Admin: publish a new active version ─────────────── */

router.put("/admin/deal-commission", requireAdmin, async (req: Request, res: Response) => {
  const { version, title, content, audience: audienceRaw } = req.body || {};
  if (typeof version !== "string" || version.trim().length === 0) {
    res.status(400).json({ error: "version is required" });
    return;
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (typeof content !== "string" || content.trim().length < 100) {
    res.status(400).json({ error: "content is required (min 100 chars)" });
    return;
  }
  const audience = normalizeAudience(audienceRaw);
  const trimmedVersion = version.trim();
  const trimmedTitle = title.trim();
  const hash = sha256Hex(content);

  const client = await db().connect();
  try {
    await client.query("BEGIN");
    // Deactivate the currently active doc for THIS audience only.
    await client.query(
      `UPDATE deal_commission_documents SET is_active = false WHERE is_active = true AND audience = $1`,
      [audience]
    );
    // Insert new active version (per-audience uniqueness on version+audience).
    const { rows } = await client.query(
      `INSERT INTO deal_commission_documents (version, title, content, content_hash, is_active, created_by, audience)
       VALUES ($1, $2, $3, $4, true, $5, $6)
       ON CONFLICT (version, audience) DO UPDATE
         SET title = EXCLUDED.title,
             content = EXCLUDED.content,
             content_hash = EXCLUDED.content_hash,
             is_active = true,
             created_by = COALESCE(EXCLUDED.created_by, deal_commission_documents.created_by)
       RETURNING id, version, title, content_hash, is_active, audience, created_at`,
      [trimmedVersion, trimmedTitle, content, hash, req.authUser?.id || null, audience]
    );
    await client.query("COMMIT");
    res.json({ success: true, document: rows[0] });
  } catch (e: any) {
    try { await client.query("ROLLBACK"); } catch { /* swallow */ }
    console.error("[deal-commission] admin publish error:", e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

/* ─────────────── Admin: list all signatures ─────────────── */

router.get(
  "/admin/deal-commission/signatures",
  requireAdmin,
  async (_req, res) => {
    try {
      const { rows } = await db().query(
        `SELECT id, deal_room_id, user_id, side, user_email, signature_name,
                document_id, document_version, document_hash, ip, user_agent, signed_at
           FROM deal_commission_signatures
           ORDER BY signed_at DESC`
      );
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Eagerly trigger pool init + migration on module load.
setImmediate(() => {
  try { db(); } catch (e) { console.error("[deal-commission] eager init failed:", e); }
});

export default router;
