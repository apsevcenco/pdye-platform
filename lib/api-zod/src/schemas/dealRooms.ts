import { z } from "zod";
import { uuidSchema } from "./common";

export const DEAL_ROOM_BLOCK_KEYS = [
  "specs",
  "photos",
  "documents",
  "chat",
  "location",
  "yacht_name",
  "identities",
] as const;

export const DealRoomBlockKey = z.enum(DEAL_ROOM_BLOCK_KEYS);

export const DealRoomIdParams = z.object({ id: uuidSchema });
export const DealRoomRoomIdParams = z.object({ roomId: uuidSchema });
export const DealRoomByUserParams = z.object({ userId: uuidSchema });
export const DealRoomBlockParams = z.object({
  id: uuidSchema,
  blockKey: DealRoomBlockKey,
});

export const DealRoomListQuery = z
  .object({
    include_archived: z.enum(["true", "false"]).optional(),
  })
  .partial();

// Status / side / role values are intentionally permissive strings (not enums)
// because the platform has historically used a wide and evolving vocabulary
// (e.g. "draft", "active", "closed", "cancelled", "completed", "on_hold",
// "platform" side for admin participants, "admin" role, etc.). The goal here
// is to reject *malformed* input (wrong types, oversize strings, garbage),
// not to gate on the exact business vocabulary — that lives in the DB and
// the route handlers.
const shortString = (max = 120) => z.string().max(max);
const optionalShortString = (max = 120) =>
  z.string().max(max).optional().nullable();

const isoDateOptional = z
  .string()
  .max(64)
  .optional()
  .nullable();

export const CreateDealRoomBody = z.object({
  yacht_id: uuidSchema,
  buyer_user_id: uuidSchema.optional().nullable(),
  seller_user_id: uuidSchema.optional().nullable(),
  notes: z.string().max(8000).optional().nullable(),
  status: optionalShortString(60),
  nda_required: z.boolean().optional(),
});

export const UpdateDealRoomBody = z
  .object({
    status: optionalShortString(60),
    buyer_user_id: uuidSchema.optional().nullable(),
    seller_user_id: uuidSchema.optional().nullable(),
    seller_type: optionalShortString(60),
    nda_required: z.boolean().optional(),
    buyer_nda_status: optionalShortString(60),
    seller_nda_status: optionalShortString(60),
    buyer_nda_sent_at: isoDateOptional,
    seller_nda_sent_at: isoDateOptional,
    buyer_nda_signed_at: isoDateOptional,
    seller_nda_signed_at: isoDateOptional,
    fully_activated_at: isoDateOptional,
    notes: z.string().max(8000).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });

export const CreateParticipantBody = z.object({
  user_id: uuidSchema,
  role: optionalShortString(60),
  side: optionalShortString(60),
  can_view: z.boolean().optional(),
  can_message: z.boolean().optional(),
  can_download: z.boolean().optional(),
});

export const UpdateParticipantBody = z
  .object({
    role: optionalShortString(60),
    side: optionalShortString(60),
    can_view: z.boolean().optional(),
    can_message: z.boolean().optional(),
    can_download: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one allowed field must be provided",
  });

export const PostMessageBody = z.object({
  message: z
    .string()
    .min(1, "Message text required")
    .max(10_000, "Message is too long"),
  is_system: z.boolean().optional(),
}).passthrough();

export const BlockUpdateBody = z.object({
  is_unlocked: z.boolean(),
}).passthrough();

export const ArchiveBody = z.object({
  archived: z.boolean().optional(),
});

export const NdaEnvelopeBody = z.object({
  deal_room_id: uuidSchema,
  user_id: uuidSchema,
  side: optionalShortString(60),
  provider: shortString(120).optional(),
  status: shortString(60).optional(),
  sent_at: isoDateOptional,
  signed_at: isoDateOptional,
  completed_at: isoDateOptional,
  document_name: z.string().max(500).optional().nullable(),
});

export const AuditLogBody = z.object({
  entity_type: z.string().min(1).max(120),
  entity_id: z.string().min(1).max(200),
  action: z.string().min(1).max(120),
  meta: z.record(z.unknown()).optional().nullable(),
}).passthrough();

export const AuditLogParams = z.object({
  entityType: z.string().min(1).max(120),
  entityId: z.string().min(1).max(200),
});

export type CreateDealRoomBody = z.infer<typeof CreateDealRoomBody>;
export type UpdateDealRoomBody = z.infer<typeof UpdateDealRoomBody>;
export type CreateParticipantBody = z.infer<typeof CreateParticipantBody>;
export type UpdateParticipantBody = z.infer<typeof UpdateParticipantBody>;
export type PostMessageBody = z.infer<typeof PostMessageBody>;
export type BlockUpdateBody = z.infer<typeof BlockUpdateBody>;
export type ArchiveBody = z.infer<typeof ArchiveBody>;
export type NdaEnvelopeBody = z.infer<typeof NdaEnvelopeBody>;
export type AuditLogBody = z.infer<typeof AuditLogBody>;
