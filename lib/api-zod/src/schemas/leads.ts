import { z } from "zod";
import { leadIdSchema, optionalSiteUrl } from "./common";

export const ApproveLeadParams = z.object({
  id: leadIdSchema,
});

export const ApproveLeadBody = z.object({
  role: z
    .enum(["broker", "owner", "investor", "admin"])
    .optional(),
  siteUrl: optionalSiteUrl,
});

export type ApproveLeadParams = z.infer<typeof ApproveLeadParams>;
export type ApproveLeadBody = z.infer<typeof ApproveLeadBody>;
