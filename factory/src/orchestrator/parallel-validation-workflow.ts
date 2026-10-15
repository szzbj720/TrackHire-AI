import type {
    ReviewWorkflow,
    ReviewWorkflowResult,
  } from "./review-workflow.js";
  import type {
    ParallelExecutionResult,
  } from "./parallel-execution-workflow.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import {
    Orchestrator,
  } from "./orchestrator.js";
  
  export interface ParallelValidationResult {
    task: ParallelExecutionResult["task"];
    implementation: ImplementationResult;
    validation: ValidationResult;
    review?: ReviewWorkflowResult;
  }
  
  export class ParallelValidationWorkflow {
    constructor(
      private readonly validator: Validator,
      private readonly reviewWorkflow: ReviewWorkflow,
    ) {}
  
    async run(
      execution: ParallelExecutionResult,
    ): Promise<ParallelValidationResult> {
      if (
        execution.task.status !== "VALIDATING"
      ) {
        throw new Error(
          `Cannot validate parallel execution while task is in state ${execution.task.status}.`,
        );
      }
  
      const implementation =
        this.aggregateImplementations(
          execution,
        );
  
      const validation =
        await this.validator.validate(
          execution.integrationWorktree.path,
        );
  
      const orchestrator =
        new Orchestrator(
          execution.task,
        );
  
      if (!validation.passed) {
        orchestrator.transition(
          "DIAGNOSING_FAILURE",
        );
  
        return {
          task: orchestrator.getTask(),
          implementation,
          validation,
        };
      }
  
      orchestrator.transition(
        "REVIEWING",
      );
  
      const review =
        await this.reviewWorkflow.run({
          task: orchestrator.getTask(),
          implementation,
          validation,
          worktreePath:
            execution.integrationWorktree.path,
          baseRef: execution.baseCommit,
        });
  
      return {
        task: review.task,
        implementation,
        validation,
        review,
      };
    }
  
    private aggregateImplementations(
      execution: ParallelExecutionResult,
    ): ImplementationResult {
      return {
        summary:
          "Integrated parallel implementation.",
        changedFiles:
          execution.workerResults.flatMap(
            (result) =>
              result.implementation
                .changedFiles,
          ),
        commandsRun:
          execution.workerResults.flatMap(
            (result) =>
              result.implementation
                .commandsRun,
          ),
        assumptions:
          execution.workerResults.flatMap(
            (result) =>
              result.implementation
                .assumptions,
          ),
        warnings:
          execution.workerResults.flatMap(
            (result) =>
              result.implementation
                .warnings,
          ),
        requiresHumanInput:
          execution.workerResults.some(
            (result) =>
              result.implementation
                .requiresHumanInput,
          ),
      };
    }
  }