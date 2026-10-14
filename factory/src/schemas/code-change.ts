import { z } from "zod";

export const fileWriteSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  summary: z.string().min(1),
});

export const codeChangeSetSchema = z.object({
  summary: z.string().min(1),

  writes: z.array(fileWriteSchema),

  assumptions: z.array(z.string()),

  warnings: z.array(z.string()),

  requiresHumanInput: z.boolean(),
});

export type FileWrite = z.infer<
  typeof fileWriteSchema
>;

export type CodeChangeSet = z.infer<
  typeof codeChangeSetSchema
>;