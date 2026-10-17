import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    GitHubClient,
  } from "./github-client.js";
  
  export class DraftPullRequestService {
    constructor(
      private readonly client: GitHubClient,
    ) {}
  
    async create(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult> {
      const result =
        await this.client.createDraftPullRequest(
          request,
        );
  
      if (!result.isDraft) {
        throw new Error(
          "GitHub client returned a non-draft pull request.",
        );
      }
  
      if (result.status !== "draft") {
        throw new Error(
          "GitHub client returned an unexpected pull request status.",
        );
      }
  
      return result;
    }
  }