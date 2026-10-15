import { z } from "zod";

export const changeEvidenceSchema =
  z.object({
    approvedFiles: z.array(
      z.string().min(1),
    ),
    reportedFiles: z.array(
      z.string().min(1),
    ),
    observedFiles: z.array(
      z.string().min(1),
    ),
    unreportedFiles: z.array(
      z.string().min(1),
    ),
    missingReportedFiles: z.array(
      z.string().min(1),
    ),
    unapprovedFiles: z.array(
      z.string().min(1),
    ),
    withinApprovedScope: z.boolean(),
    reportMatchesObserved:
      z.boolean(),
    patch: z.string(),
  });

export type ChangeEvidence =
  z.infer<
    typeof changeEvidenceSchema
  >;