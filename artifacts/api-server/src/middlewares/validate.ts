import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

function formatIssues(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
}

function makeValidator(source: Source, schema: ZodTypeAny, mutate: boolean): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const input = req[source];
    const result = schema.safeParse(input);
    if (!result.success) {
      res.status(400).json({
        error: `Invalid request ${source}`,
        issues: formatIssues(result.error),
      });
      return;
    }
    if (mutate) {
      try {
        (req as unknown as Record<Source, unknown>)[source] = result.data;
      } catch {
        // req.query / req.params can be read-only in Express 5; ignore.
      }
    }
    next();
  };
}

export const validateBody = (schema: ZodTypeAny): RequestHandler =>
  makeValidator("body", schema, true);

export const validateQuery = (schema: ZodTypeAny): RequestHandler =>
  makeValidator("query", schema, false);

export const validateParams = (schema: ZodTypeAny): RequestHandler =>
  makeValidator("params", schema, false);
