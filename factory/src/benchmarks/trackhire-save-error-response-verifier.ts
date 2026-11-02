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
  "trackhire-save-error-response";

const backendFixturePath =
  "backend/factory_benchmark_save_error_response_test.js";

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

export class TrackHireSaveErrorResponseVerifier
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
        `TrackHireSaveErrorResponseVerifier cannot verify scenario ${input.scenario.id}.`,
      );
    }

    const fetchErrorResponse =
      await this.runBackendCriterion(
        input.workspace,
        "save-fetch-error-response",
      );

    const successContract =
      await this.runBackendCriterion(
        input.workspace,
        "save-success-contract",
      );

    const notFoundContract =
      await this.runBackendCriterion(
        input.workspace,
        "save-not-found-contract",
      );

    const syntaxCheck =
      await this.commandRunner.run(
        "node",
        ["--check", "backend/server.js"],
        input.workspace.path,
      );

    const analysis =
      await this.commandRunner.run(
        "flutter",
        ["analyze", "lib"],
        input.workspace.path,
      );

    const existingTests =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          existingRegressionTestPath,
        ],
        input.workspace.path,
      );

    return [
      {
        criterionId:
          "save-fetch-error-response",
        passed:
          fetchErrorResponse.exitCode === 0,
        evidence: commandEvidence(
          fetchErrorResponse,
          "Saved-status post-update fetch failures use the intended HTTP 500 response path.",
        ),
      },
      {
        criterionId:
          "save-success-contract",
        passed:
          successContract.exitCode === 0,
        evidence: commandEvidence(
          successContract,
          "Saved-status success behavior continues to return the updated application.",
        ),
      },
      {
        criterionId:
          "save-not-found-contract",
        passed:
          notFoundContract.exitCode === 0,
        evidence: commandEvidence(
          notFoundContract,
          "Saved-status application-not-found behavior continues to return HTTP 404.",
        ),
      },
      {
        criterionId: "regression",
        passed:
          syntaxCheck.exitCode === 0 &&
          analysis.exitCode === 0 &&
          existingTests.exitCode === 0,
        evidence: [
          ...commandEvidence(
            syntaxCheck,
            "Backend syntax validation passed.",
          ),
          ...commandEvidence(
            analysis,
            "Flutter analysis passed.",
          ),
          ...commandEvidence(
            existingTests,
            "Existing JobApplication tests passed.",
          ),
        ],
      },
    ];
  }

  private async runBackendCriterion(
    workspace: BenchmarkWorkspace,
    criterionId: string,
  ): Promise<BenchmarkCommandResult> {
    return this.commandRunner.run(
      "node",
      [
        backendFixturePath,
        criterionId,
      ],
      workspace.path,
    );
  }
}
