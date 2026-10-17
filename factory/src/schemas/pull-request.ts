import { z } from "zod";

export const pullRequestStatusSchema = z.enum([
  "draft",
  "open",
  "closed",
  "merged",
]);

export type PullRequestStatus = z.infer<
  typeof pullRequestStatusSchema
>;

export const createDraftPullRequestRequestSchema = z.object({
  repository: z.string().min(1),
  baseBranch: z.string().min(1),
  headBranch: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
});

export type CreateDraftPullRequestRequest = z.infer<
  typeof createDraftPullRequestRequestSchema
>;

export const pullRequestResultSchema = z.object({
  number: z.number().int().positive(),
  url: z.string().url(),
  repository: z.string().min(1),
  baseBranch: z.string().min(1),
  headBranch: z.string().min(1),
  title: z.string().min(1),
  status: pullRequestStatusSchema,
  isDraft: z.boolean(),
});

export type PullRequestResult = z.infer<
  typeof pullRequestResultSchema
>;