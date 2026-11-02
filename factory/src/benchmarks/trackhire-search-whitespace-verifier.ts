import type {
  BenchmarkCriterionVerification,
  BenchmarkCriterionVerifier,
} from "./deterministic-acceptance-collector.js";
import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";
import type { EngineeringTask } from "../schemas/task.js";
import type { BenchmarkWorkspace } from "./benchmark-workspace-manager.js";
import {
  ProcessBenchmarkCommandRunner,
  type BenchmarkCommandResult,
  type BenchmarkCommandRunner,
} from "./trackhire-interview-date-verifier.js";

const scenarioId =
  "trackhire-search-whitespace";

const fixturePath =
  "test/factory_benchmark_search_whitespace_test.dart";

const existingRegressionTestPath =
  "test/job_application_test.dart";

function commandEvidence(
  result: BenchmarkCommandResult,
  successMessage: string,
): string[] {
  if (result.exitCode === 0) {
    return [successMessage];
  }

  const evidence = [
    `Command exited with code ${result.exitCode}.`,
  ];

  if (result.stdout.trim().length > 0) {
    evidence.push(result.stdout.trim());
  }

  if (result.stderr.trim().length > 0) {
    evidence.push(result.stderr.trim());
  }

  return evidence;
}

export class TrackHireSearchWhitespaceVerifier
  implements BenchmarkCriterionVerifier
{
  constructor(
    private readonly commandRunner: BenchmarkCommandRunner =
      new ProcessBenchmarkCommandRunner(),
  ) {}

  async verify(input: {
    scenario: BenchmarkScenario;
    task: EngineeringTask;
    workspace: BenchmarkWorkspace;
  }): Promise<BenchmarkCriterionVerification[]> {
    if (input.scenario.id !== scenarioId) {
      throw new Error(
        `TrackHireSearchWhitespaceVerifier cannot verify scenario ${input.scenario.id}.`,
      );
    }

    const trimSearchWhitespaceResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "trim-search-whitespace",
        ],
        input.workspace.path,
      );

    const caseInsensitiveSearchResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "case-insensitive-search",
        ],
        input.workspace.path,
      );

    const searchableFieldsResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "searchable-fields",
        ],
        input.workspace.path,
      );

    const combinedFiltersResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "combined-filters",
        ],
        input.workspace.path,
      );

    const clearSearchResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "clear-search",
        ],
        input.workspace.path,
      );

    const analysisResult =
      await this.commandRunner.run(
        "flutter",
        ["analyze", "lib"],
        input.workspace.path,
      );

    const regressionTestResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          existingRegressionTestPath,
        ],
        input.workspace.path,
      );

    const regressionPassed =
      analysisResult.exitCode === 0 &&
      regressionTestResult.exitCode === 0;

    return [
      {
        criterionId:
          "trim-search-whitespace",
        passed:
          trimSearchWhitespaceResult.exitCode ===
          0,
        evidence: commandEvidence(
          trimSearchWhitespaceResult,
          "Search ignores leading and trailing whitespace.",
        ),
      },
      {
        criterionId:
          "case-insensitive-search",
        passed:
          caseInsensitiveSearchResult.exitCode ===
          0,
        evidence: commandEvidence(
          caseInsensitiveSearchResult,
          "Search remains case-insensitive.",
        ),
      },
      {
        criterionId:
          "searchable-fields",
        passed:
          searchableFieldsResult.exitCode === 0,
        evidence: commandEvidence(
          searchableFieldsResult,
          "Search continues to match all existing searchable fields.",
        ),
      },
      {
        criterionId:
          "combined-filters",
        passed:
          combinedFiltersResult.exitCode === 0,
        evidence: commandEvidence(
          combinedFiltersResult,
          "Normalized search composes with status and materials filters.",
        ),
      },
      {
        criterionId: "clear-search",
        passed:
          clearSearchResult.exitCode === 0,
        evidence: commandEvidence(
          clearSearchResult,
          "Clearing search restores the unsearched application set.",
        ),
      },
      {
        criterionId: "regression",
        passed: regressionPassed,
        evidence: regressionPassed
          ? [
              "Flutter analysis and existing JobApplication tests passed.",
            ]
          : [
              ...commandEvidence(
                analysisResult,
                "Flutter analysis passed.",
              ),
              ...commandEvidence(
                regressionTestResult,
                "Existing JobApplication tests passed.",
              ),
            ],
      },
    ];
  }
}
