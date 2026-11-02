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
  "trackhire-required-field-whitespace";

const fixturePath =
  "test/factory_benchmark_required_field_whitespace_test.dart";

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

export class TrackHireRequiredFieldWhitespaceVerifier
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
        `TrackHireRequiredFieldWhitespaceVerifier cannot verify scenario ${input.scenario.id}.`,
      );
    }

    const whitespaceCompanyResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "reject-whitespace-company",
        ],
        input.workspace.path,
      );

    const whitespaceRoleResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "reject-whitespace-role",
        ],
        input.workspace.path,
      );

    const validationMessageResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "validation-message",
        ],
        input.workspace.path,
      );

    const validInputResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "valid-input",
        ],
        input.workspace.path,
      );

    const editBehaviorResult =
      await this.commandRunner.run(
        "flutter",
        [
          "test",
          fixturePath,
          "--plain-name",
          "edit-behavior",
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
          "reject-whitespace-company",
        passed:
          whitespaceCompanyResult.exitCode === 0,
        evidence: commandEvidence(
          whitespaceCompanyResult,
          "Whitespace-only company input is rejected.",
        ),
      },
      {
        criterionId:
          "reject-whitespace-role",
        passed:
          whitespaceRoleResult.exitCode === 0,
        evidence: commandEvidence(
          whitespaceRoleResult,
          "Whitespace-only role input is rejected.",
        ),
      },
      {
        criterionId:
          "validation-message",
        passed:
          validationMessageResult.exitCode === 0,
        evidence: commandEvidence(
          validationMessageResult,
          "Required-field validation message remains unchanged.",
        ),
      },
      {
        criterionId: "valid-input",
        passed:
          validInputResult.exitCode === 0,
        evidence: commandEvidence(
          validInputResult,
          "Valid company and role values continue to save.",
        ),
      },
      {
        criterionId: "edit-behavior",
        passed:
          editBehaviorResult.exitCode === 0,
        evidence: commandEvidence(
          editBehaviorResult,
          "Existing application values continue to populate in edit mode.",
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
