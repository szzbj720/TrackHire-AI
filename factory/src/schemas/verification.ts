import { z } from "zod";

export const verificationProbeSchema =
  z.object({
    id: z.string().min(1),
    hypothesis: z.string().min(1),
    rationale: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()),
    expectedOutcome:
      z.string().min(1),
    requirement:
      z.string().min(1).optional(),
  });

export const verificationProbeResultSchema =
  z.object({
    probeId: z.string().min(1),
    command: z.string().min(1),
    args: z.array(z.string()),
    exitCode: z.number().int(),
    stdout: z.string(),
    stderr: z.string(),
    durationMs:
      z.number().nonnegative(),
    passed: z.boolean(),
  });

export const verificationResultSchema =
  z.object({
    passed: z.boolean(),
    probes:
      z.array(
        verificationProbeResultSchema,
      ).min(1),
    failedProbes:
      z.array(z.string()),
    durationMs:
      z.number().nonnegative(),
  });

export type VerificationProbe =
  z.infer<
    typeof verificationProbeSchema
  >;

export type VerificationProbeResult =
  z.infer<
    typeof verificationProbeResultSchema
  >;

export type VerificationResult =
  z.infer<
    typeof verificationResultSchema
  >;
