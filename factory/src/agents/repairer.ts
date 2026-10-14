import type {
    ModelProvider,
  } from "../models/provider.js";
  import {
    codeChangeSetSchema,
  } from "../schemas/code-change.js";
  import type {
    FailureDiagnosis,
  } from "../schemas/diagnosis.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import {
    Workspace,
  } from "../tools/workspace.js";
  
  export interface RepairerInput {
    task: EngineeringTask;
    plan: ImplementationPlan;
    implementation: ImplementationResult;
    validation: ValidationResult;
    diagnosis: FailureDiagnosis;
    relevantFiles: Array<{
      path: string;
      content: string;
    }>;
    worktreePath: string;
  }
  
  export interface Repairer {
    repair(
      input: RepairerInput,
    ): Promise<ImplementationResult>;
  }
  
  export class ModelRepairer
    implements Repairer
  {
    constructor(
      private readonly provider: ModelProvider,
    ) {}
  
    async repair(
      input: RepairerInput,
    ): Promise<ImplementationResult> {
      if (!input.diagnosis.repairable) {
        throw new Error(
          "Cannot repair a failure marked as non-repairable.",
        );
      }
  
      if (
        input.diagnosis.requiresHumanInput
      ) {
        throw new Error(
          "Cannot repair a failure that requires human input.",
        );
      }
  
      const response =
        await this.provider.generate({
          systemPrompt: [
            "You are a software engineering repair agent.",
            "Repair a failed implementation using the supplied task, approved plan, deterministic validation evidence, failure diagnosis, and current files.",
            "Only modify files listed in the approved plan's affectedFiles.",
            "Do not expand the scope of the approved plan.",
            "Do not claim that tests or commands passed because you do not run validation.",
            "Return complete replacement file contents for every file you modify.",
            "If the repair cannot be performed safely with the available evidence, set requiresHumanInput to true and return no writes.",
            "Return only valid JSON matching the requested CodeChangeSet structure.",
          ].join(" "),
  
          userPrompt: JSON.stringify({
            task: {
              request: input.task.request,
              requirements:
                input.task.requirements,
              acceptanceCriteria:
                input.task.acceptanceCriteria,
              constraints:
                input.task.constraints,
            },
            plan: input.plan,
            previousImplementation:
              input.implementation,
            validation: input.validation,
            diagnosis: input.diagnosis,
            relevantFiles:
              input.relevantFiles,
          }),
        });
  
      const parsed: unknown = JSON.parse(
        response.content,
      );
  
      const changeSet =
        codeChangeSetSchema.parse(parsed);
  
      if (changeSet.requiresHumanInput) {
        return {
          summary: changeSet.summary,
          changedFiles: [],
          commandsRun: [],
          assumptions:
            changeSet.assumptions,
          warnings: changeSet.warnings,
          requiresHumanInput: true,
        };
      }
  
      const approvedFiles = new Set(
        input.plan.affectedFiles,
      );
  
      for (const write of changeSet.writes) {
        if (!approvedFiles.has(write.path)) {
          throw new Error(
            `Repair attempted to modify unapproved file: ${write.path}`,
          );
        }
      }
  
      const workspace = new Workspace(
        input.worktreePath,
      );
  
      for (const write of changeSet.writes) {
        await workspace.write(
          write.path,
          write.content,
        );
      }
  
      return {
        summary: changeSet.summary,
        changedFiles:
          changeSet.writes.map(
            (write) => ({
              path: write.path,
              changeType:
                "modified" as const,
              summary: write.summary,
            }),
          ),
        commandsRun: [],
        assumptions:
          changeSet.assumptions,
        warnings: changeSet.warnings,
        requiresHumanInput: false,
      };
    }
  }