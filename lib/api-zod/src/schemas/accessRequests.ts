import { z } from "zod";
import { uuidSchema, optionalSiteUrl } from "./common";

export const RejectAccessRequestParams = z.object({
  id: uuidSchema,
});

export const RejectAccessRequestBody = z.object({
  reason: z.string().max(4000, "Reason is too long").optional(),
  siteUrl: optionalSiteUrl,
});

export type RejectAccessRequestParams = z.infer<typeof RejectAccessRequestParams>;
export type RejectAccessRequestBody = z.infer<typeof RejectAccessRequestBody>;
