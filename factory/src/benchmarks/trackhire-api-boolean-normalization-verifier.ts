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
  "trackhire-api-boolean-normalization";

const fixturePath =
  "test/factory_benchmark_api_boolean_normalization_test.dart";

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

export class TrackHireApiBooleanNormalizationVerifier
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
        `TrackHireApiBooleanNormalizationVerifier cannot verify scenario ${input.scenario.id}.`,
      );
    }

    const integerBooleans =
      await this.runFixtureGroup(
        input.workspace,
        "integer-booleans",
      );

    const nativeBooleans =
      await this.runFixtureGroup(
        input.workspace,
        "native-booleans",
      );

    const missingBooleans =
      await this.runFixtureGroup(
        input.workspace,
        "missing-booleans",
      );

    const nonBooleanFields =
      await this.runFixtureGroup(
        input.workspace,
        "non-boolean-fields",
      );

    const databaseDeserialization =
      await this.runFixtureGroup(
        input.workspace,
        "database-deserialization",
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
        criterionId: "integer-booleans",
        passed:
          integerBooleans.exitCode === 0,
        evidence: commandEvidence(
          integerBooleans,
          "API deserialization accepted SQLite-style integer boolean values.",
        ),
      },
      {
        criterionId: "native-booleans",
        passed:
          nativeBooleans.exitCode === 0,
        evidence: commandEvidence(
          nativeBooleans,
          "API deserialization preserved native boolean behavior.",
        ),
      },
      {
        criterionId: "missing-booleans",
        passed:
          missingBooleans.exitCode === 0,
        evidence: commandEvidence(
          missingBooleans,
          "Missing API boolean fields defaulted to false.",
        ),
      },
      {
        criterionId: "non-boolean-fields",
        passed:
          nonBooleanFields.exitCode === 0,
        evidence: commandEvidence(
          nonBooleanFields,
          "Non-boolean API fields and defaults were preserved.",
        ),
      },
      {
        criterionId:
          "database-deserialization",
        passed:
          databaseDeserialization.exitCode ===
          0,
        evidence: commandEvidence(
          databaseDeserialization,
          "Database integer boolean deserialization remained correct.",
        ),
      },
      {
        criterionId: "regression",
        passed:
          analysis.exitCode === 0 &&
          existingTests.exitCode === 0,
        evidence: [
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

  private async runFixtureGroup(
    workspace: BenchmarkWorkspace,
    groupName: string,
  ): Promise<BenchmarkCommandResult> {
    return this.commandRunner.run(
      "flutter",
      [
        "test",
        fixturePath,
        "--plain-name",
        groupName,
      ],
      workspace.path,
    );
  }
}
