import { z } from "zod";

/**
 * The /api/upload-photo endpoint takes a single multipart "photo" file. The
 * file itself is validated by multer (size limit + mime allowlist) and a
 * magic-byte sniff in the route handler. This schema validates the *text*
 * fields of the multipart body — there should not be any. We use `.strict()`
 * so any unexpected non-file form fields are rejected rather than silently
 * ignored.
 */
export const UploadPhotoBody = z.object({}).strict();

export type UploadPhotoBody = z.infer<typeof UploadPhotoBody>;

/**
 * The /api/upload-document endpoint takes a single multipart "document" file
 * (PDF only). Like UploadPhotoBody, the file is validated by multer + magic
 * bytes in the route handler. No extra text fields are expected.
 */
export const UploadDocumentBody = z.object({}).strict();

export type UploadDocumentBody = z.infer<typeof UploadDocumentBody>;
