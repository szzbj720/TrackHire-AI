import type {
    Diagnostician,
  } from "../agents/diagnostician.js";
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
  import { Workspace } from "../tools/workspace.js";
  import { Orchestrator } from "./orchestrator.js";
  
  export interface DiagnosisWorkflowInput {
    task: EngineeringTask;
    implementation: ImplementationResult;
    validation: ValidationResult;
    worktreePath: string;
  }
  
  export interface DiagnosisWorkflowResult {
    task: EngineeringTask;
    diagnosis: FailureDiagnosis;
  }
  
  export class DiagnosisWorkflow {
    constructor(
      private readonly diagnostician: Diagnostician,
      private readonly repairConfidenceThreshold = 0.7,
    ) {}
  
    async run(
      input: DiagnosisWorkflowInput,
    ): Promise<DiagnosisWorkflowResult> {
      if (
        input.task.status !==
        "DIAGNOSING_FAILURE"
      ) {
        throw new Error(
          `Cannot diagnose failure while task is in state ${input.task.status}`,
        );
      }
  
      if (!input.task.plan) {
        throw new Error(
          "Cannot diagnose failure without an approved plan.",
        );
      }
  
      if (input.validation.passed) {
        throw new Error(
          "Cannot diagnose a successful validation result.",
        );
      }
  
      const workspace = new Workspace(
        input.worktreePath,
      );
  
      const relevantFiles =
        await this.readRelevantFiles(
          workspace,
          input.task.plan.affectedFiles,
        );
  
      const diagnosis =
        await this.diagnostician.diagnose({
          task: input.task,
          plan: input.task.plan,
          implementation:
            input.implementation,
          validation: input.validation,
          relevantFiles,
        });
  
      const orchestrator =
        new Orchestrator(input.task);
  
      if (
        diagnosis.repairable &&
        !diagnosis.requiresHumanInput &&
        diagnosis.confidence >=
          this.repairConfidenceThreshold
      ) {
        orchestrator.transition(
          "REPAIRING",
        );
      } else {
        orchestrator.transition(
          "NEEDS_HUMAN",
        );
      }
  
      return {
        task: orchestrator.getTask(),
        diagnosis,
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