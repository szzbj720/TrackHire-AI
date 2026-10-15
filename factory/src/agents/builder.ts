import type {
    CodeChangeSet,
  } from "../schemas/code-change.js";
  import {
    codeChangeSetSchema,
  } from "../schemas/code-change.js";
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
    ModelProvider,
  } from "../models/provider.js";
  import { Workspace } from "../tools/workspace.js";
  
  export interface BuilderInput {
    task: EngineeringTask;
    plan: ImplementationPlan;
    worktreePath: string;
  }
  
  export interface Builder {
    implement(
      input: BuilderInput,
    ): Promise<ImplementationResult>;
  }
  
  export class ModelBuilder implements Builder {
    constructor(
      private readonly provider: ModelProvider,
    ) {}
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      const workspace = new Workspace(
        input.worktreePath,
      );
  
      const fileContents = await this.readPlanFiles(
        workspace,
        input.plan,
      );
  
      const response = await this.provider.generate({
        systemPrompt: [
          "You are a software engineering implementation agent.",
          "Implement only the approved implementation plan.",
          "Return complete replacement contents for every file you want to modify.",
          "Do not modify files outside the approved plan.",
          "Do not claim that tests passed because validation is performed independently.",
          "If the task cannot be implemented safely from the supplied context, set requiresHumanInput to true and return no writes.",
          "Return only valid JSON matching the requested CodeChangeSet structure.",
        ].join(" "),
  
        userPrompt: JSON.stringify({
          task: {
            request: input.task.request,
            requirements: input.task.requirements,
            acceptanceCriteria:
              input.task.acceptanceCriteria,
            constraints: input.task.constraints,
          },
          plan: input.plan,
          files: fileContents,
        }),
      });
  
      const parsed: unknown = JSON.parse(
        response.content,
      );
  
      const changeSet =
        codeChangeSetSchema.parse(parsed);
  
      if (changeSet.requiresHumanInput) {
        return this.createHumanInputResult(
          changeSet,
        );
      }
  
      this.assertWritesAreApproved(
        changeSet,
        input.plan,
      );
  
      for (const write of changeSet.writes) {
        await workspace.write(
          write.path,
          write.content,
        );
      }
  
      return {
        summary: changeSet.summary,
  
        changedFiles: changeSet.writes.map(
          (write) => ({
            path: write.path,
            changeType: "modified" as const,
            summary: write.summary,
          }),
        ),
  
        commandsRun: [],
  
        assumptions: changeSet.assumptions,
  
        warnings: changeSet.warnings,
  
        requiresHumanInput: false,
      };
    }
  
    private async readPlanFiles(
      workspace: Workspace,
      plan: ImplementationPlan,
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
  
      for (const path of plan.affectedFiles) {
        const content = await workspace.read(path);
  
        files.push({
          path,
          content,
        });
      }
  
      return files;
    }
  
    private assertWritesAreApproved(
      changeSet: CodeChangeSet,
      plan: ImplementationPlan,
    ): void {
      const approvedFiles = new Set(
        plan.affectedFiles,
      );
  
      for (const write of changeSet.writes) {
        if (!approvedFiles.has(write.path)) {
          throw new Error(
            `Builder attempted to modify an unapproved file: ${write.path}`,
          );
        }
      }
    }
  
    private createHumanInputResult(
      changeSet: CodeChangeSet,
    ): ImplementationResult {
      if (changeSet.writes.length > 0) {
        throw new Error(
          "Builder cannot request human input while also proposing file writes.",
        );
      }
  
      return {
        summary: changeSet.summary,
        changedFiles: [],
        commandsRun: [],
        assumptions: changeSet.assumptions,
        warnings: changeSet.warnings,
        requiresHumanInput: true,
      };
    }
  }