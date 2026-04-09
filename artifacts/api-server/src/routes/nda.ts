import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function authenticateRequest(req: Request): Promise<{ userId: string; role?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const userClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase!.from("users").select("role").eq("id", user.id).single();
  return { userId: user.id, role: profile?.role };
}

router.post("/nda/send", async (req: Request, res: Response) => {
  try {
    const caller = await authenticateRequest(req);
    if (!caller || caller.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { deal_room_id, side, user_id } = req.body;

    if (!deal_room_id || !side || !user_id) {
      return res.status(400).json({ error: "Missing required fields: deal_room_id, side, user_id" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Server not configured for NDA operations" });
    }

    const now = new Date().toISOString();

    await supabase.from("nda_envelopes").insert([{
      deal_room_id,
      user_id,
      side,
      provider: "internal",
      status: "sent",
      sent_at: now,
      document_name: "PDYE NDA v1",
    }]);

    const updateField = side === "buyer" ? "buyer_nda_status" : "seller_nda_status";
    const sentAtField = side === "buyer" ? "buyer_nda_sent_at" : "seller_nda_sent_at";

    const updates: Record<string, any> = {
      [updateField]: "sent",
      [sentAtField]: now,
      updated_at: now,
    };

    const { data: room } = await supabase.from("deal_rooms").select("status").eq("id", deal_room_id).single();
    if (room?.status === "draft") {
      updates.status = "nda_pending";
    }

    await supabase.from("deal_rooms").update(updates).eq("id", deal_room_id);

    await supabase.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: deal_room_id,
      user_id,
      action: "nda_sent_via_api",
      meta: { side, provider: "internal" },
    }]);

    return res.json({ success: true, message: `NDA sent to ${side}` });
  } catch (err: any) {
    console.error("NDA send error:", err);
    return res.status(500).json({ error: "Failed to send NDA" });
  }
});

router.post("/nda/sign", async (req: Request, res: Response) => {
  try {
    const caller = await authenticateRequest(req);
    if (!caller) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { deal_room_id, side } = req.body;
    const user_id = caller.userId;

    if (!deal_room_id || !side) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (side !== "buyer" && side !== "seller") {
      return res.status(400).json({ error: "Side must be buyer or seller" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const { data: room } = await supabase.from("deal_rooms").select("buyer_user_id, seller_user_id").eq("id", deal_room_id).single();
    if (!room) {
      return res.status(404).json({ error: "Deal room not found" });
    }
    const isParticipant = (side === "buyer" && room.buyer_user_id === user_id) || (side === "seller" && room.seller_user_id === user_id);
    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant of this deal room on the specified side" });
    }

    const now = new Date().toISOString();

    await supabase.from("nda_envelopes").upsert({
      deal_room_id,
      user_id,
      side,
      provider: "internal",
      status: "signed",
      signed_at: now,
      completed_at: now,
    }, { onConflict: "deal_room_id,user_id,side" });

    const statusField = side === "buyer" ? "buyer_nda_status" : "seller_nda_status";
    const signedAtField = side === "buyer" ? "buyer_nda_signed_at" : "seller_nda_signed_at";

    await supabase.from("deal_rooms").update({
      [statusField]: "signed",
      [signedAtField]: now,
      updated_at: now,
    }).eq("id", deal_room_id);

    const { data: updatedRoom } = await supabase.from("deal_rooms").select("buyer_nda_status, seller_nda_status").eq("id", deal_room_id).single();

    let activated = false;
    if (updatedRoom && updatedRoom.buyer_nda_status === "signed" && updatedRoom.seller_nda_status === "signed") {
      await supabase.from("deal_rooms").update({
        status: "active",
        fully_activated_at: now,
        updated_at: now,
      }).eq("id", deal_room_id);

      await supabase.from("deal_room_participants").update({
        can_view: true,
        can_message: true,
        can_download: true,
      }).eq("deal_room_id", deal_room_id);

      await supabase.from("deal_room_messages").insert([{
        deal_room_id,
        sender_id: user_id,
        message: "Deal room activated after NDA completion by both parties.",
        is_system: true,
      }]);

      await supabase.from("audit_logs").insert([{
        entity_type: "deal_room",
        entity_id: deal_room_id,
        user_id,
        action: "deal_room_activated",
        meta: { activated_at: now },
      }]);

      activated = true;
    } else {
      await supabase.from("deal_rooms").update({
        status: "partially_signed",
        updated_at: now,
      }).eq("id", deal_room_id);
    }

    await supabase.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: deal_room_id,
      user_id,
      action: "nda_signed_via_api",
      meta: { side },
    }]);

    return res.json({ success: true, activated, message: activated ? "NDA signed, deal room activated" : "NDA signed" });
  } catch (err: any) {
    console.error("NDA sign error:", err);
    return res.status(500).json({ error: "Failed to sign NDA" });
  }
});

router.post("/nda/webhook/docusign", async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET;
    if (webhookSecret) {
      const hmac = req.headers["x-docusign-signature-1"];
      if (!hmac) {
        return res.status(401).json({ error: "Missing signature" });
      }
    }

    const event = req.body;
    console.log("[DocuSign Webhook] Received event:", JSON.stringify(event).slice(0, 500));

    if (!supabase) {
      return res.status(200).json({ received: true, processed: false, reason: "No DB configured" });
    }

    const envelopeId = event?.data?.envelopeId || event?.envelopeId;
    const eventType = event?.event || event?.status;

    if (envelopeId && eventType) {
      await supabase.from("nda_envelopes").update({
        status: eventType === "envelope-completed" ? "signed" : eventType,
        raw_payload: event,
        updated_at: new Date().toISOString(),
        ...(eventType === "envelope-completed" ? { signed_at: new Date().toISOString(), completed_at: new Date().toISOString() } : {}),
      }).eq("envelope_id", envelopeId);

      await supabase.from("audit_logs").insert([{
        entity_type: "nda_envelope",
        entity_id: envelopeId,
        action: "docusign_webhook",
        meta: { event_type: eventType, envelope_id: envelopeId },
      }]);
    }

    return res.status(200).json({ received: true, processed: true });
  } catch (err: any) {
    console.error("DocuSign webhook error:", err);
    return res.status(200).json({ received: true, processed: false });
  }
});

router.get("/nda/status/:dealRoomId", async (req: Request, res: Response) => {
  try {
    const caller = await authenticateRequest(req);
    if (!caller) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!supabase) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const { dealRoomId } = req.params;

    if (caller.role !== "admin") {
      const { data: room } = await supabase.from("deal_rooms").select("buyer_user_id, seller_user_id").eq("id", dealRoomId).single();
      if (!room || (room.buyer_user_id !== caller.userId && room.seller_user_id !== caller.userId)) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: envelopes } = await supabase
      .from("nda_envelopes")
      .select("*")
      .eq("deal_room_id", dealRoomId)
      .order("created_at", { ascending: false });

    const { data: room } = await supabase
      .from("deal_rooms")
      .select("status, buyer_nda_status, seller_nda_status, buyer_nda_signed_at, seller_nda_signed_at, fully_activated_at")
      .eq("id", dealRoomId)
      .single();

    return res.json({ room, envelopes: envelopes || [] });
  } catch (err: any) {
    console.error("NDA status error:", err);
    return res.status(500).json({ error: "Failed to get NDA status" });
  }
});

export default router;
