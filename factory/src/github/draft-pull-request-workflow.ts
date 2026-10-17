import type {
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import {
    DraftPullRequestService,
  } from "./draft-pull-request-service.js";
  
  import {
    PullRequestBodyBuilder,
    type PullRequestEvidenceItem,
  } from "./pull-request-body-builder.js";
  
  export interface DraftPullRequestWorkflowInput {
    repository: string;
    baseBranch: string;
    headBranch: string;
    title: string;
    task: EngineeringTask;
    validation: ValidationResult;
    evidence: PullRequestEvidenceItem[];
  }
  
  export class DraftPullRequestWorkflow {
    constructor(
      private readonly bodyBuilder:
        PullRequestBodyBuilder,
  
      private readonly service:
        DraftPullRequestService,
    ) {}
  
    async run(
      input: DraftPullRequestWorkflowInput,
    ): Promise<PullRequestResult> {
      const body =
        this.bodyBuilder.build({
          task:
            input.task,
  
          validation:
            input.validation,
  
          evidence:
            input.evidence,
        });
  
      return this.service.create({
        request: {
          repository:
            input.repository,
  
          baseBranch:
            input.baseBranch,
  
          headBranch:
            input.headBranch,
  
          title:
            input.title,
  
          body,
        },
  
        validation:
          input.validation,
      });
    }
  }