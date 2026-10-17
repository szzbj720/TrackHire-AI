import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  export interface GitHubClient {
    createDraftPullRequest(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult>;
  }