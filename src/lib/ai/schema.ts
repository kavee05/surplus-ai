import { z } from "zod";

export const materialIds = [
  "tile-porcelain",
  "tile-wall",
  "plywood",
  "batten",
  "paver",
  "kerb",
  "rebar",
  "brc-mesh",
  "aggregate",
  "sand",
  "cement",
  "prop",
  "u-drain",
  "barrier",
  "netting",
  "unknown",
] as const;

export const PhotoAnalysis = z.object({
  materialId: z.enum(materialIds),
  itemName: z.string().max(120),
  category: z.string().max(60),
  condition: z.enum(["new", "good", "usable", "poor"]),
  estimatedQty: z.number().min(0).max(1_000_000),
  unit: z.string().max(20),
  needsEngineerApproval: z.boolean(),
  confidence: z.number().min(0).max(1),
  notes: z.string().max(400),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysis>;

/** Same fields without bounds, sent to the provider as the output format. */
export const PhotoWire = z.object({
  materialId: z.enum(materialIds),
  itemName: z.string(),
  category: z.string(),
  condition: z.enum(["new", "good", "usable", "poor"]),
  estimatedQty: z.number(),
  unit: z.string(),
  needsEngineerApproval: z.boolean(),
  confidence: z.number(),
  notes: z.string(),
});

export const photoGeminiSchema = {
  type: "OBJECT",
  properties: {
    materialId: { type: "STRING", enum: [...materialIds] },
    itemName: { type: "STRING" },
    category: { type: "STRING" },
    condition: { type: "STRING", enum: ["new", "good", "usable", "poor"] },
    estimatedQty: { type: "NUMBER" },
    unit: { type: "STRING" },
    needsEngineerApproval: { type: "BOOLEAN" },
    confidence: { type: "NUMBER" },
    notes: { type: "STRING" },
  },
  required: ["materialId", "itemName", "category", "condition", "estimatedQty", "unit", "needsEngineerApproval", "confidence", "notes"],
};

/** Clamp small format slips before strict validation. */
export function normalizePhoto(raw: Record<string, unknown>): Record<string, unknown> {
  if (typeof raw.confidence === "number" && raw.confidence > 1) raw.confidence = Math.min(1, raw.confidence / 100);
  if (typeof raw.estimatedQty === "number" && raw.estimatedQty < 0) raw.estimatedQty = 0;
  for (const [k, n] of [["itemName", 120], ["category", 60], ["unit", 20], ["notes", 400]] as const) {
    if (typeof raw[k] === "string") raw[k] = (raw[k] as string).slice(0, n);
  }
  return raw;
}

/** Vercel functions accept bodies up to about 4.5 MB; the browser resizes photos well below this. */
export const MAX_IMAGE_BASE64 = 4_200_000;

export const AnalyzeRequest = z.union([
  z.object({ sampleId: z.string().max(40) }),
  z.object({
    image: z.string().max(MAX_IMAGE_BASE64),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    /** "sample" when the image is one of the bundled sample illustrations. */
    source: z.enum(["upload", "sample"]).optional(),
  }),
]);

export interface AnalyzeResponse {
  mode: "demo" | "live";
  result: PhotoAnalysis;
  /** Shown to the user when live AI was not used or failed. */
  reason?: string;
}
