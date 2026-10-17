import type {
    CreateDraftPullRequestRequest,
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    GitHubClient,
  } from "./github-client.js";
  
  export class FakeGitHubClient
    implements GitHubClient
  {
    private nextPullRequestNumber: number;
  
    private readonly createdPullRequests: PullRequestResult[] = [];
  
    constructor(
      startingPullRequestNumber = 1,
    ) {
      if (
        !Number.isInteger(
          startingPullRequestNumber,
        ) ||
        startingPullRequestNumber <= 0
      ) {
        throw new Error(
          "Starting pull request number must be a positive integer.",
        );
      }
  
      this.nextPullRequestNumber =
        startingPullRequestNumber;
    }
  
    async createDraftPullRequest(
      request: CreateDraftPullRequestRequest,
    ): Promise<PullRequestResult> {
      const number =
        this.nextPullRequestNumber;
  
      this.nextPullRequestNumber +=
        1;
  
      const result: PullRequestResult = {
        number,
  
        url:
          `https://github.com/${request.repository}/pull/${number}`,
  
        repository:
          request.repository,
  
        baseBranch:
          request.baseBranch,
  
        headBranch:
          request.headBranch,
  
        title:
          request.title,
  
        status:
          "draft",
  
        isDraft:
          true,
      };
  
      this.createdPullRequests.push(
        result,
      );
  
      return result;
    }
  
    listCreatedPullRequests(): PullRequestResult[] {
      return [
        ...this.createdPullRequests,
      ];
    }
  }