import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    PullRequestResult,
  } from "../schemas/pull-request.js";
  
  export interface FactoryRunReport {
    taskId: string;
    taskStatus: string;
    stopReason: string;
    executionMode?: string;
    validationPassed?: boolean;
    repairAttempts: number;
    requiresHumanAction: boolean;
    pullRequest?: {
      number: number;
      url: string;
      status: string;
      isDraft: boolean;
    };
  }
  
  export function buildFactoryRunReport(
    result: AdaptiveFactoryResult,
    pullRequest?: PullRequestResult,
  ): FactoryRunReport {
    const task =
      result.run.task;
  
    const requiresHumanAction =
      result.stopReason ===
        "PLAN_APPROVAL_REQUIRED" ||
      result.stopReason ===
        "PARALLEL_APPROVAL_REQUIRED" ||
      result.stopReason ===
        "FINAL_APPROVAL_REQUIRED" ||
      result.stopReason ===
        "HUMAN_INPUT_REQUIRED";
  
    const report: FactoryRunReport = {
      taskId:
        task.id,
  
      taskStatus:
        task.status,
  
      stopReason:
        result.stopReason,
  
      repairAttempts:
        task.repairAttempts,
  
      requiresHumanAction,
    };
  
    if (
      task.strategy
    ) {
      report.executionMode =
        task.strategy.mode;
    }
  
    if (
      result.run.validation
    ) {
      report.validationPassed =
        result.run.validation.passed;
    }
  
    if (
      pullRequest
    ) {
      report.pullRequest = {
        number:
          pullRequest.number,
  
        url:
          pullRequest.url,
  
        status:
          pullRequest.status,
  
        isDraft:
          pullRequest.isDraft,
      };
    }
  
    return report;
  }