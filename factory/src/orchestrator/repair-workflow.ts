import type {
    Repairer,
  } from "../agents/repairer.js";
  import type {
    FailureDiagnosis,
  } from "../schemas/diagnosis.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    Workspace,
  } from "../tools/workspace.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import {
    Orchestrator,
  } from "./orchestrator.js";
  
  export interface RepairWorkflowInput {
    task: EngineeringTask;
    implementation: ImplementationResult;
    validation: ValidationResult;
    diagnosis: FailureDiagnosis;
    worktreePath: string;
  }
  
  export interface RepairWorkflowResult {
    task: EngineeringTask;
    repair?: ImplementationResult;
    validation: ValidationResult;
  }
  
  export class RepairWorkflow {
    constructor(
      private readonly repairer: Repairer,
      private readonly validator: Validator,
      private readonly maxRepairAttempts = 2,
    ) {}
  
    async run(
      input: RepairWorkflowInput,
    ): Promise<RepairWorkflowResult> {
      if (input.task.status !== "REPAIRING") {
        throw new Error(
          `Cannot repair while task is in state ${input.task.status}`,
        );
      }
  
      if (!input.task.plan) {
        throw new Error(
          "Cannot repair without an approved plan.",
        );
      }
  
      if (input.validation.passed) {
        throw new Error(
          "Cannot repair a successful validation result.",
        );
      }
  
      if (!input.diagnosis.repairable) {
        throw new Error(
          "Cannot repair a failure marked as non-repairable.",
        );
      }
  
      if (input.diagnosis.requiresHumanInput) {
        throw new Error(
          "Cannot repair a failure that requires human input.",
        );
      }
  
      const orchestrator =
        new Orchestrator(input.task);
  
      if (
        input.task.repairAttempts >=
        this.maxRepairAttempts
      ) {
        orchestrator.transition(
          "NEEDS_HUMAN",
        );
  
        return {
          task: orchestrator.getTask(),
          validation: input.validation,
        };
      }
  
      const workspace = new Workspace(
        input.worktreePath,
      );
  
      const relevantFiles =
        await this.readRelevantFiles(
          workspace,
          input.task.plan.affectedFiles,
        );
  
      const repair =
        await this.repairer.repair({
          task: input.task,
          plan: input.task.plan,
          implementation:
            input.implementation,
          validation: input.validation,
          diagnosis: input.diagnosis,
          relevantFiles,
          worktreePath:
            input.worktreePath,
        });
  
      if (repair.requiresHumanInput) {
        orchestrator.transition(
          "NEEDS_HUMAN",
        );
  
        return {
          task: orchestrator.getTask(),
          repair,
          validation: input.validation,
        };
      }
  
      input.task.repairAttempts += 1;
      input.task.updatedAt =
        new Date().toISOString();
  
      orchestrator.transition(
        "VALIDATING",
      );
  
      const validation =
        await this.validator.validate(
          input.worktreePath,
        );
  
      if (validation.passed) {
        orchestrator.transition(
          "REVIEWING",
        );
      } else {
        orchestrator.transition(
          "DIAGNOSING_FAILURE",
        );
      }
  
      return {
        task: orchestrator.getTask(),
        repair,
        validation,
      };
    }
  
    private async readRelevantFiles(
      workspace: Workspace,
      paths: string[],
    ): Promise<
      Array<{
        path: string;
        content: string;
      }>
    > {
      const files: Array<{
        path: string;
        content: string;
      }> = [];
  
      for (const path of paths) {
        const content =
          await workspace.read(path);
  
        files.push({
          path,
          content,
        });
      }
  
      return files;
    }
  }