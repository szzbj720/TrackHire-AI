import { z } from "zod";

import {
  createDraftPullRequestRequestSchema,
  pullRequestResultSchema,
  type CreateDraftPullRequestRequest,
  type PullRequestResult,
} from "../schemas/pull-request.js";

import type {
  GitHubClient,
} from "./github-client.js";

export interface GitHubHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export interface GitHubHttpRequestInit {
  method: "POST";
  headers: Record<string, string>;
  body: string;
}

export type GitHubFetch = (
  url: string,
  init: GitHubHttpRequestInit,
) => Promise<GitHubHttpResponse>;

const githubPullRequestResponseSchema = z.object({
  number: z.number().int().positive(),
  html_url: z.string().url(),
  title: z.string().min(1),
  state: z.enum([
    "open",
    "closed",
  ]),
  draft: z.boolean(),
});

const githubErrorResponseSchema = z.object({
  message: z.string().optional(),
});

const defaultGitHubFetch: GitHubFetch =
  async (
    url,
    init,
  ) => {
    return fetch(
      url,
      init,
    );
  };

export class GitHubApiClient
  implements GitHubClient
{
  private readonly token: string;

  constructor(
    token: string,
    private readonly fetchImpl:
      GitHubFetch =
        defaultGitHubFetch,
  ) {
    const trimmedToken =
      token.trim();

    if (
      trimmedToken.length === 0
    ) {
      throw new Error(
        "GitHub token is required.",
      );
    }

    this.token =
      trimmedToken;
  }

  async createDraftPullRequest(
    request:
      CreateDraftPullRequestRequest,
  ): Promise<PullRequestResult> {
    const validatedRequest =
      createDraftPullRequestRequestSchema.parse(
        request,
      );

    const response =
      await this.fetchImpl(
        `https://api.github.com/repos/${validatedRequest.repository}/pulls`,
        {
          method:
            "POST",

          headers: {
            Accept:
              "application/vnd.github+json",

            Authorization:
              `Bearer ${this.token}`,

            "Content-Type":
              "application/json",

            "X-GitHub-Api-Version":
              "2022-11-28",
          },

          body:
            JSON.stringify({
              title:
                validatedRequest.title,

              head:
                validatedRequest.headBranch,

              base:
                validatedRequest.baseBranch,

              body:
                validatedRequest.body,

              draft:
                true,
            }),
        },
      );

    const payload =
      await response.json();

    if (!response.ok) {
      const parsedError =
        githubErrorResponseSchema.safeParse(
          payload,
        );

      const message =
        parsedError.success
          ? parsedError.data.message
          : undefined;

      throw new Error(
        message
          ? `GitHub draft pull request creation failed with status ${response.status}: ${message}`
          : `GitHub draft pull request creation failed with status ${response.status}.`,
      );
    }

    const githubPullRequest =
      githubPullRequestResponseSchema.parse(
        payload,
      );

    return pullRequestResultSchema.parse({
      number:
        githubPullRequest.number,

      url:
        githubPullRequest.html_url,

      repository:
        validatedRequest.repository,

      baseBranch:
        validatedRequest.baseBranch,

      headBranch:
        validatedRequest.headBranch,

      title:
        githubPullRequest.title,

      status:
        githubPullRequest.draft
          ? "draft"
          : githubPullRequest.state,

      isDraft:
        githubPullRequest.draft,
    });
  }
}