import { z } from "zod";

export const validationCheckSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()),
  exitCode: z.number().int(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number().nonnegative(),
  passed: z.boolean(),
});

export const validationResultSchema = z.object({
  passed: z.boolean(),
  checks: z.array(validationCheckSchema).min(1),
  failedChecks: z.array(z.string()),
  durationMs: z.number().nonnegative(),
});

export type ValidationCheck = z.infer<
  typeof validationCheckSchema
>;

export type ValidationResult = z.infer<
  typeof validationResultSchema
>;