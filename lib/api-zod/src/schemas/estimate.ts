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

export const ValuationBody = z
  .object({
    ...yachtFieldsShape,
    mode: z.enum(["builder", "specs"]).optional(),
    units: z.enum(["metric", "imperial"]).optional(),
    bypass_required: z.boolean().optional(),
  })
  .passthrough();

export type EstimateMarketPriceBody = z.infer<typeof EstimateMarketPriceBody>;
export type ValuationBody = z.infer<typeof ValuationBody>;
