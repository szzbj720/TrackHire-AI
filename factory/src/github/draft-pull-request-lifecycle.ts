import type {
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import {
    DraftPullRequestWorkflow,
  } from "./draft-pull-request-workflow.js";
  
  import type {
    PullRequestEvidenceItem,
  } from "./pull-request-body-builder.js";
  
  export interface DraftPullRequestLifecycleInput {
    result: AdaptiveFactoryResult;
    repository: string;
    baseBranch: string;
    headBranch: string;
    title: string;
    evidence: PullRequestEvidenceItem[];
  }
  
  export class DraftPullRequestLifecycle {
    constructor(
      private readonly workflow:
        DraftPullRequestWorkflow,
    ) {}
  
    async create(
      input: DraftPullRequestLifecycleInput,
    ): Promise<PullRequestResult> {
      if (
        input.result.stopReason !==
        "FINAL_APPROVAL_REQUIRED"
      ) {
        throw new Error(
          `Cannot create a draft pull request from stop reason ${input.result.stopReason}.`,
        );
      }
  
      if (
        input.result.run.task.status !==
        "AWAITING_FINAL_APPROVAL"
      ) {
        throw new Error(
          `Cannot create a draft pull request from task state ${input.result.run.task.status}.`,
        );
      }
  
      const validation =
        input.result.run.validation;
  
      if (!validation) {
        throw new Error(
          "Cannot create a draft pull request without validation evidence.",
        );
      }
  
      if (!validation.passed) {
        throw new Error(
          "Cannot create a draft pull request because validation failed.",
        );
      }
  
      return this.workflow.run({
        repository:
          input.repository,
  
        baseBranch:
          input.baseBranch,
  
        headBranch:
          input.headBranch,
  
        title:
          input.title,
  
        task:
          input.result.run.task,
  
        validation,
  
        evidence:
          input.evidence,
      });
    }
  }