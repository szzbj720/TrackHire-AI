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
    type BenchmarkCommandResult,
  } from "./trackhire-interview-date-verifier.js";
  
  const TRACKHIRE_SCENARIO_ID =
    "trackhire-application-source";
  
  const DART_FIXTURE_PATH =
    "test/factory_benchmark_application_source_test.dart";
  
  const BACKEND_FIXTURE_PATH =
    "backend/factory_benchmark_application_source_test.js";
  
  const EXISTING_REGRESSION_TEST_PATH =
    "test/job_application_test.dart";
  
  const PRODUCTION_ANALYSIS_PATHS = [
    "lib",
    "backend",
  ];
  
  interface DartCriterionCommand {
    criterionId: string;
    plainName: string;
  }
  
  const dartCriterionCommands:
    DartCriterionCommand[] = [
      {
        criterionId:
          "optional-source",
        plainName:
          "optional-source",
      },
      {
        criterionId:
          "serialize-source",
        plainName:
          "serialize-source",
      },
    ];
  
  function commandEvidence(
    result: BenchmarkCommandResult,
  ): string[] {
    const command = [
      result.command,
      ...result.args,
    ].join(" ");
  
    const evidence = [
      `Command: ${command}`,
      `Exit code: ${result.exitCode}`,
    ];
  
    const stdout =
      result.stdout.trim();
  
    const stderr =
      result.stderr.trim();
  
    if (stdout.length > 0) {
      evidence.push(
        `stdout: ${stdout}`,
      );
    }
  
    if (stderr.length > 0) {
      evidence.push(
        `stderr: ${stderr}`,
      );
    }
  
    return evidence;
  }
  
  export class TrackHireApplicationSourceVerifier
    implements BenchmarkCriterionVerifier {
    constructor(
      private readonly commandRunner:
        BenchmarkCommandRunner =
          new ProcessBenchmarkCommandRunner(),
    ) {}
  
    async verify(input: {
      scenario:
        BenchmarkScenario;
      workspace:
        BenchmarkWorkspace;
      task:
        EngineeringTask;
    }): Promise<
      BenchmarkCriterionVerification[]
    > {
      if (
        input.scenario.id !==
        TRACKHIRE_SCENARIO_ID
      ) {
        throw new Error(
          `TrackHire application-source verifier cannot verify scenario: ${input.scenario.id}`,
        );
      }
  
      const criterionResults:
        BenchmarkCriterionVerification[] =
          [];
  
      for (
        const criterion
        of dartCriterionCommands
      ) {
        const result =
          await this.commandRunner.run(
            "flutter",
            [
              "test",
              DART_FIXTURE_PATH,
              "--plain-name",
              criterion.plainName,
            ],
            input.workspace.path,
          );
  
        criterionResults.push({
          criterionId:
            criterion.criterionId,
          passed:
            result.exitCode === 0,
          evidence:
            commandEvidence(
              result,
            ),
        });
      }
  
      const backendResult =
        await this.commandRunner.run(
          "node",
          [
            BACKEND_FIXTURE_PATH,
          ],
          input.workspace.path,
        );
  
      for (
        const criterionId
        of [
          "create-source",
          "update-source",
          "reload-source",
        ]
      ) {
        criterionResults.push({
          criterionId,
          passed:
            backendResult.exitCode === 0,
          evidence:
            commandEvidence(
              backendResult,
            ),
        });
      }
  
      const analyzeResult =
        await this.commandRunner.run(
          "flutter",
          [
            "analyze",
            ...PRODUCTION_ANALYSIS_PATHS,
          ],
          input.workspace.path,
        );
  
      const regressionTestResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            EXISTING_REGRESSION_TEST_PATH,
          ],
          input.workspace.path,
        );
  
      criterionResults.push({
        criterionId:
          "regression",
        passed:
          analyzeResult.exitCode === 0 &&
          regressionTestResult.exitCode === 0,
        evidence: [
          ...commandEvidence(
            analyzeResult,
          ),
          ...commandEvidence(
            regressionTestResult,
          ),
        ],
      });
  
      return criterionResults;
    }
  }