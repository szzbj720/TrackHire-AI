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
    "trackhire-status-summary";
  
  const BENCHMARK_TEST_PATH =
    "test/factory_benchmark_status_summary_test.dart";
  
  const EXISTING_REGRESSION_TEST_PATH =
    "test/job_application_test.dart";
  
  const PRODUCTION_ANALYSIS_PATHS = [
    "lib",
    "backend",
  ];
  
  interface CriterionCommand {
    criterionId: string;
    plainName: string;
  }
  
  const criterionCommands:
    CriterionCommand[] = [
      {
        criterionId:
          "counts-statuses",
  
        plainName:
          "counts-statuses",
      },
  
      {
        criterionId:
          "zero-counts",
  
        plainName:
          "zero-counts",
      },
  
      {
        criterionId:
          "updates-summary",
  
        plainName:
          "updates-summary",
      },
  
      {
        criterionId:
          "all-statuses",
  
        plainName:
          "all-statuses",
      },
    ];
  
  function commandEvidence(
    result:
      BenchmarkCommandResult,
  ): string[] {
    const command =
      [
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
  
    if (
      stdout.length > 0
    ) {
      evidence.push(
        `stdout: ${stdout}`,
      );
    }
  
    if (
      stderr.length > 0
    ) {
      evidence.push(
        `stderr: ${stderr}`,
      );
    }
  
    return evidence;
  }
  
  export class TrackHireStatusSummaryVerifier
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
          `TrackHire status-summary verifier cannot verify scenario: ${input.scenario.id}`,
        );
      }
  
      const criterionResults:
        BenchmarkCriterionVerification[] =
          [];
  
      for (
        const criterion
        of criterionCommands
      ) {
        const result =
          await this.commandRunner.run(
            "flutter",
            [
              "test",
              BENCHMARK_TEST_PATH,
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