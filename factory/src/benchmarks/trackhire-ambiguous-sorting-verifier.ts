import type {
  BenchmarkCriterionVerification,
  BenchmarkCriterionVerifier,
} from "./deterministic-acceptance-collector.js";

import type {
  BenchmarkScenario,
} from "../schemas/benchmark-scenario.js";

import type {
  EngineeringTask,
} from "../schemas/task.js";

import type {
  BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

import {
  ProcessBenchmarkCommandRunner,
  type BenchmarkCommandRunner,
} from "./trackhire-interview-date-verifier.js";

const scenarioId =
  "trackhire-ambiguous-sorting";

export class TrackHireAmbiguousSortingVerifier
  implements BenchmarkCriterionVerifier
{
  constructor(
    private readonly commandRunner:
      BenchmarkCommandRunner =
        new ProcessBenchmarkCommandRunner(),
  ) {}

  async verify(input: {
    scenario: BenchmarkScenario;
    task: EngineeringTask;
    workspace: BenchmarkWorkspace;
  }): Promise<BenchmarkCriterionVerification[]> {
    if (input.scenario.id !== scenarioId) {
      throw new Error(
        `TrackHireAmbiguousSortingVerifier cannot verify scenario ${input.scenario.id}.`,
      );
    }

    const gitStatus =
      await this.commandRunner.run(
        "git",
        ["status", "--porcelain"],
        input.workspace.path,
      );

    const workspaceClean =
      gitStatus.exitCode === 0 &&
      gitStatus.stdout.trim().length === 0;

    const analysisRecognizedAmbiguity =
      input.task.analysis !== undefined &&
      input.task.analysis.requiresHumanInput &&
      input.task.analysis.ambiguities.length > 0;

    const requestedClarification =
      input.task.status === "NEEDS_HUMAN";

    const stoppedBeforePlanning =
      input.task.strategy === undefined &&
      input.task.plan === undefined;

    return [
      {
        criterionId:
          "recognize-ambiguity",
        passed:
          analysisRecognizedAmbiguity,
        evidence:
          analysisRecognizedAmbiguity
            ? [
                "Task analysis identified unresolved ambiguity and required human input.",
                ...input.task.analysis!.ambiguities,
              ]
            : [
                "Task analysis did not identify unresolved ambiguity requiring human input.",
              ],
      },
      {
        criterionId:
          "request-clarification",
        passed:
          requestedClarification &&
          stoppedBeforePlanning,
        evidence:
          requestedClarification &&
          stoppedBeforePlanning
            ? [
                "Task reached NEEDS_HUMAN before strategy selection or planning.",
              ]
            : [
                `Final task status was ${input.task.status}.`,
                input.task.strategy
                  ? `A ${input.task.strategy.mode} strategy was selected.`
                  : "No execution strategy was selected.",
                input.task.plan
                  ? "An implementation plan was created."
                  : "No implementation plan was created.",
              ],
      },
      {
        criterionId:
          "no-implementation-before-clarification",
        passed:
          requestedClarification &&
          stoppedBeforePlanning &&
          workspaceClean,
        evidence:
          workspaceClean
            ? [
                "The benchmark workspace remained unchanged.",
              ]
            : [
                "The benchmark workspace contains repository changes.",
                gitStatus.stdout.trim() ||
                  gitStatus.stderr.trim() ||
                  `git status exited with code ${gitStatus.exitCode}.`,
              ],
      },
      {
        criterionId:
          "no-invented-sort-contract",
        passed:
          analysisRecognizedAmbiguity &&
          requestedClarification &&
          stoppedBeforePlanning &&
          workspaceClean,
        evidence:
          analysisRecognizedAmbiguity &&
          requestedClarification &&
          stoppedBeforePlanning &&
          workspaceClean
            ? [
                "Execution stopped for clarification without selecting a strategy, creating a plan, or modifying the repository.",
              ]
            : [
                "The factory did not cleanly stop before introducing implementation assumptions.",
              ],
      },
    ];
  }
}
