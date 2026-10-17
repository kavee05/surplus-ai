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

export const AnalyzeRequest = z.union([
  z.object({ sampleId: z.string().max(40) }),
  z.object({ image: z.string().max(5_600_000), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) }),
]);

export interface AnalyzeResponse {
  mode: "demo" | "live";
  result: PhotoAnalysis;
}
