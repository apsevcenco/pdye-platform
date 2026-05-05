import { z } from "zod";
import { emailSchema } from "./common";

export const CheckEmailQuery = z.object({
  email: emailSchema,
});

export type CheckEmailQuery = z.infer<typeof CheckEmailQuery>;
