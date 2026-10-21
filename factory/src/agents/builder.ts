import type {
  ImplementationResult,
} from "../schemas/implementation.js";

import type {
  ImplementationPlan,
  PlanStep,
} from "../schemas/plan.js";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import type {
  ModelProvider,
} from "../models/provider.js";

import {
  Workspace,
} from "../tools/workspace.js";

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

interface StepImplementationResult {
  summary: string;
  changedFiles:
    ImplementationResult["changedFiles"];
  assumptions: string[];
  warnings: string[];
  requiresHumanInput: boolean;
}

export class ModelBuilder
  implements Builder {
  constructor(
    private readonly provider:
      ModelProvider,
  ) {}

  async implement(
    input: BuilderInput,
  ): Promise<ImplementationResult> {
    const workspace =
      new Workspace(
        input.worktreePath,
      );

    const changedFiles:
      ImplementationResult["changedFiles"] =
        [];

    const summaries:
      string[] = [];

    const assumptions:
      string[] = [];

    const warnings:
      string[] = [];

    const orderedSteps =
      [...input.plan.steps].sort(
        (
          left,
          right,
        ) =>
          left.order -
          right.order,
      );

    for (
      const step of
        orderedSteps
    ) {
      const result =
        await this.implementStep(
          input.task,
          input.plan,
          step,
          workspace,
        );

      summaries.push(
        result.summary,
      );

      assumptions.push(
        ...result.assumptions,
      );

      warnings.push(
        ...result.warnings,
      );

      if (
        result.requiresHumanInput
      ) {
        return {
          summary:
            summaries.join(
              " ",
            ),

          changedFiles,

          commandsRun:
            [],

          assumptions:
            this.uniqueStrings(
              assumptions,
            ),

          warnings:
            this.uniqueStrings(
              warnings,
            ),

          requiresHumanInput:
            true,
        };
      }

      changedFiles.push(
        ...result.changedFiles,
      );
    }

    this.assertPlanCoverage(
      changedFiles.map(
        (
          file,
        ) => file.path,
      ),
      input.plan,
    );

    return {
      summary:
        summaries.join(
          " ",
        ),

      changedFiles,

      commandsRun:
        [],

      assumptions:
        this.uniqueStrings(
          assumptions,
        ),

      warnings:
        this.uniqueStrings(
          warnings,
        ),

      requiresHumanInput:
        false,
    };
  }

  private async implementStep(
    task: EngineeringTask,
    plan: ImplementationPlan,
    step: PlanStep,
    workspace: Workspace,
  ): Promise<StepImplementationResult> {
    const stepFiles =
      this.uniqueStrings(
        step.files,
      );

    if (
      stepFiles.length === 0
    ) {
      throw new Error(
        `Implementation step ${step.order} does not contain any files.`,
      );
    }

    this.assertStepFilesAreApproved(
      stepFiles,
      plan,
    );

    if (
      stepFiles.length !== 1
    ) {
      throw new Error(
        [
          "Local builder requires one file per implementation step.",
          `Step ${step.order} contains ${stepFiles.length} files.`,
        ].join(
          " ",
        ),
      );
    }

    const path =
      stepFiles[0];

    if (
      path === undefined
    ) {
      throw new Error(
        `Implementation step ${step.order} does not contain a valid file path.`,
      );
    }

    const original =
      await workspace.read(
        path,
      );

    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are a careful software engineering implementation agent.",
          "You are modifying exactly one existing source file.",
          "The original source file supplied by the user is complete production code.",
          "Return ONLY the complete replacement source file.",
          "Do not return JSON.",
          "Do not return Markdown.",
          "Do not use triple backticks.",
          "Do not include explanations before or after the source code.",
          "Start from the exact original source file.",
          "Make only the smallest changes necessary for the current implementation step.",
          "Preserve all unrelated imports, declarations, classes, methods, widgets, comments, formatting, and behavior.",
          "Do not remove existing code unless the current implementation step explicitly requires it.",
          "The returned source must be a complete replacement for the original file.",
        ].join(
          " ",
        ),

        userPrompt:
          [
            "TASK:",
            task.request,
            "",
            "CURRENT IMPLEMENTATION STEP:",
            step.description,
            "",
            "RATIONALE:",
            step.rationale,
            "",
            "FILE PATH:",
            path,
            "",
            "OVERALL PLAN:",
            plan.summary,
            "",
            "ORIGINAL COMPLETE SOURCE FILE:",
            original,
            "",
            "Return only the complete replacement source file.",
          ].join(
            "\n",
          ),
      });

    const replacement =
      this.cleanModelSource(
        response.content,
      );

    this.assertReplacementFileIsSafe(
      path,
      original,
      replacement,
    );

    await workspace.write(
      path,
      replacement,
    );

    return {
      summary:
        `Implemented plan step ${step.order}: ${step.description}`,

      changedFiles: [
        {
          path,

          changeType:
            "modified",

          summary:
            step.description,
        },
      ],

      assumptions:
        [],

      warnings:
        [],

      requiresHumanInput:
        false,
    };
  }

  private cleanModelSource(
    content: string,
  ): string {
    let cleaned =
      content.trim();

    const fencedMatch =
      cleaned.match(
        /^```(?:[a-zA-Z0-9_+-]+)?\s*\n([\s\S]*?)\n```$/,
      );

    const fencedContent =
      fencedMatch?.[1];

    if (
      fencedContent !== undefined
    ) {
      cleaned =
        fencedContent.trim();
    }

    return `${cleaned}\n`;
  }

  private assertStepFilesAreApproved(
    stepFiles: string[],
    plan: ImplementationPlan,
  ): void {
    const approvedFiles =
      new Set(
        plan.affectedFiles,
      );

    for (
      const path of
        stepFiles
    ) {
      if (
        !approvedFiles.has(
          path,
        )
      ) {
        throw new Error(
          `Builder attempted to modify an unapproved file: ${path}`,
        );
      }
    }
  }

  private assertReplacementFileIsSafe(
    path: string,
    original: string,
    replacement: string,
  ): void {
    if (
      replacement.trim().length ===
      0
    ) {
      throw new Error(
        `Builder returned an empty replacement for ${path}.`,
      );
    }

    if (
      replacement.trim().startsWith(
        "{",
      ) &&
      replacement.includes(
        "\"writes\"",
      )
    ) {
      throw new Error(
        `Builder returned JSON instead of source code for ${path}.`,
      );
    }

    const originalLength =
      original.length;

    const replacementLength =
      replacement.length;

    if (
      originalLength > 0 &&
      replacementLength <
        originalLength * 0.6
    ) {
      throw new Error(
        [
          `Builder produced a suspiciously small replacement for ${path}.`,
          `Original size: ${originalLength} characters.`,
          `Replacement size: ${replacementLength} characters.`,
          "Refusing to write the file.",
        ].join(
          " ",
        ),
      );
    }

    if (
      originalLength > 0 &&
      replacementLength >
        originalLength * 2.5
    ) {
      throw new Error(
        [
          `Builder produced a suspiciously large replacement for ${path}.`,
          `Original size: ${originalLength} characters.`,
          `Replacement size: ${replacementLength} characters.`,
          "Refusing to write the file.",
        ].join(
          " ",
        ),
      );
    }
  }

  private assertPlanCoverage(
    changedPaths: string[],
    plan: ImplementationPlan,
  ): void {
    const changedFiles =
      new Set(
        changedPaths,
      );

    const requiredFiles =
      new Set(
        plan.steps.flatMap(
          (
            step,
          ) => step.files,
        ),
      );

    const missingFiles =
      [...requiredFiles].filter(
        (
          path,
        ) =>
          !changedFiles.has(
            path,
          ),
      );

    if (
      missingFiles.length >
      0
    ) {
      throw new Error(
        [
          "Builder did not complete the approved implementation plan.",
          `Missing files: ${missingFiles.join(", ")}`,
        ].join(
          " ",
        ),
      );
    }
  }

  private uniqueStrings(
    values: string[],
  ): string[] {
    return [
      ...new Set(
        values,
      ),
    ];
  }
}