import { z } from "zod";

const stringOrNumber = z.union([z.string(), z.number()]);

const yachtFieldsShape = {
  name: z.string().max(200).optional(),
  type: z.string().max(120).optional(),
  builder: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  configuration: z.string().max(120).optional(),
  year: stringOrNumber.optional(),
  refit: stringOrNumber.optional(),
  condition: z.string().max(200).optional(),
  length: stringOrNumber.optional(),
  beam: stringOrNumber.optional(),
  draft: stringOrNumber.optional(),
  displacement: stringOrNumber.optional(),
  gross_tonnage: stringOrNumber.optional(),
  hull_material: z.string().max(120).optional(),
  hull_type: z.string().max(120).optional(),
  engines: z.string().max(200).optional(),
  engine_count: stringOrNumber.optional(),
  engine_maker: z.string().max(200).optional(),
  engine_model: z.string().max(200).optional(),
  horse_power: stringOrNumber.optional(),
  fuel_type: z.string().max(120).optional(),
  fuel_capacity: stringOrNumber.optional(),
  water_capacity: stringOrNumber.optional(),
  max_speed: stringOrNumber.optional(),
  cruise_speed: stringOrNumber.optional(),
  range: stringOrNumber.optional(),
  cabins: stringOrNumber.optional(),
  heads: stringOrNumber.optional(),
  berths: stringOrNumber.optional(),
  crew: stringOrNumber.optional(),
  location: z.string().max(200).optional(),
  flag: z.string().max(120).optional(),
  price: stringOrNumber.optional(),
  // Market context — region of intended sale and VAT/tax status.
  // Both feed directly into the AI prompt to constrain comparables.
  sale_region: z
    .enum([
      "mediterranean",
      "northern_europe",
      "north_america_caribbean",
      "asia_pacific_me",
      "global",
    ])
    .optional(),
  vat_status: z.enum(["paid", "not_paid"]).optional(),
};

export const EstimateMarketPriceBody = z
  .object({
    ...yachtFieldsShape,
    name: z
      .string()
      .min(1, "Yacht name is required")
      .max(200, "Yacht name is too long"),
  })
  .passthrough();

// VAT/Tax cohort filter is only commercially relevant for the EU-adjacent
// markets where free-circulation status changes the buyer's effective price.
// For US/Caribbean and APAC/ME we don't ask for it (and don't require it).
// Keep this set in sync with VAT_RELEVANT_REGIONS in
// artifacts/pdye/src/pages/Valuation.tsx.
const VAT_RELEVANT_SALE_REGIONS = new Set([
  "mediterranean",
  "northern_europe",
  "global",
]);

export const ValuationBody = z
  .object({
    ...yachtFieldsShape,
    // sale_region is ALWAYS required at the API boundary — there is no
    // sensible default ("global" is a deliberate user choice, not a fallback).
    sale_region: z
      .enum([
        "mediterranean",
        "northern_europe",
        "north_america_caribbean",
        "asia_pacific_me",
        "global",
      ]),
    mode: z.enum(["builder", "specs"]).optional(),
    units: z.enum(["metric", "imperial"]).optional(),
    bypass_required: z.boolean().optional(),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    // Conditionally require vat_status: only when the chosen sale_region is in
    // a VAT-relevant market. Mirrors the UI's conditional render.
    if (VAT_RELEVANT_SALE_REGIONS.has(val.sale_region) && !val.vat_status) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vat_status"],
        message:
          "vat_status is required when sale_region is mediterranean, northern_europe, or global",
      });
    }
  });

export type EstimateMarketPriceBody = z.infer<typeof EstimateMarketPriceBody>;
export type ValuationBody = z.infer<typeof ValuationBody>;
