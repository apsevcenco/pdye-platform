import { z } from "zod";

export const uuidSchema = z.string().uuid("Must be a valid UUID");

export const leadIdSchema = z
  .string()
  .min(1, "Lead id is required")
  .refine(
    (v) => /^\d+$/.test(v) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    { message: "Lead id must be a positive integer or UUID" }
  );

export const optionalSiteUrl = z
  .string()
  .url("siteUrl must be a valid URL")
  .max(2048, "siteUrl is too long")
  .optional();

export const emailSchema = z
  .string()
  .min(3, "Email is required")
  .max(320, "Email is too long")
  .email("Invalid email");

export const shortTextSchema = (max = 2000) =>
  z.string().max(max, `Must be at most ${max} characters`);

export const optionalShortText = (max = 2000) =>
  z.string().max(max, `Must be at most ${max} characters`).optional().nullable();
