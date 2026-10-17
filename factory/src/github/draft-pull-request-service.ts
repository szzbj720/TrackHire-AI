import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    GitHubClient,
  } from "./github-client.js";
  
  export interface CreateValidatedDraftPullRequestInput {
    request: CreateDraftPullRequestRequest;
    validation: ValidationResult;
  }
  
  export class DraftPullRequestService {
    constructor(
      private readonly client: GitHubClient,
    ) {}
  
    async create(
      input: CreateValidatedDraftPullRequestInput,
    ): Promise<PullRequestResult> {
      if (!input.validation.passed) {
        throw new Error(
          "Cannot create a draft pull request because validation failed.",
        );
      }
  
      const result =
        await this.client.createDraftPullRequest(
          input.request,
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