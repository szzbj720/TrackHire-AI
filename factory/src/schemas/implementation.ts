import { z } from "zod";

export const fileChangeSchema = z.object({
  path: z.string().min(1),
  changeType: z.enum([
    "created",
    "modified",
    "deleted",
  ]),
  summary: z.string().min(1),
});

export const implementationResultSchema = z.object({
  summary: z.string().min(1),

  changedFiles: z.array(fileChangeSchema),

  commandsRun: z.array(z.string()),

  assumptions: z.array(z.string()),

  warnings: z.array(z.string()),

  requiresHumanInput: z.boolean(),
});

export type FileChange = z.infer<
  typeof fileChangeSchema
>;

export type ImplementationResult = z.infer<
  typeof implementationResultSchema
>;