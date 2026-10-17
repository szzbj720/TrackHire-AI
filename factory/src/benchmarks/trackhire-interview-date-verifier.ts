import {
    spawn,
  } from "node:child_process";
  
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
  
  const TRACKHIRE_SCENARIO_ID =
    "trackhire-interview-date";
  
  const BENCHMARK_TEST_PATH =
    "test/factory_benchmark_interview_date_test.dart";
  
  export interface BenchmarkCommandResult {
    command: string;
    args: string[];
    exitCode: number;
    stdout: string;
    stderr: string;
  }
  
  export interface BenchmarkCommandRunner {
    run(
      command: string,
      args: string[],
      cwd: string,
    ): Promise<BenchmarkCommandResult>;
  }
  
  export class ProcessBenchmarkCommandRunner
    implements BenchmarkCommandRunner {
    async run(
      command: string,
      args: string[],
      cwd: string,
    ): Promise<BenchmarkCommandResult> {
      return await new Promise(
        (
          resolve,
          reject,
        ) => {
          const child =
            spawn(
              command,
              args,
              {
                cwd,
                shell: false,
              },
            );
  
          let stdout = "";
          let stderr = "";
  
          child.stdout.on(
            "data",
            (data: Buffer | string) => {
              stdout +=
                data.toString();
            },
          );
  
          child.stderr.on(
            "data",
            (data: Buffer | string) => {
              stderr +=
                data.toString();
            },
          );
  
          child.on(
            "error",
            reject,
          );
  
          child.on(
            "close",
            (code) => {
              resolve({
                command,
                args,
                exitCode:
                  code ?? 1,
                stdout,
                stderr,
              });
            },
          );
        },
      );
    }
  }
  
  interface CriterionCommand {
    criterionId: string;
    plainName: string;
  }
  
  const criterionCommands:
    CriterionCommand[] = [
      {
        criterionId:
          "optional-date",
  
        plainName:
          "optional-date",
      },
      {
        criterionId:
          "persist-date",
  
        plainName:
          "persist-date",
      },
      {
        criterionId:
          "upcoming-interviews",
  
        plainName:
          "upcoming-interviews",
      },
      {
        criterionId:
          "edit-date",
  
        plainName:
          "edit-date",
      },
    ];
  
  function commandEvidence(
    result: BenchmarkCommandResult,
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
  
  export class TrackHireInterviewDateVerifier
    implements BenchmarkCriterionVerifier {
    constructor(
      private readonly commandRunner:
        BenchmarkCommandRunner =
          new ProcessBenchmarkCommandRunner(),
    ) {}
  
    async verify(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
      task: EngineeringTask;
    }): Promise<
      BenchmarkCriterionVerification[]
    > {
      if (
        input.scenario.id !==
        TRACKHIRE_SCENARIO_ID
      ) {
        throw new Error(
          `TrackHire interview-date verifier cannot verify scenario: ${input.scenario.id}`,
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
          ],
          input.workspace.path,
        );
  
      const fullTestResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
          ],
          input.workspace.path,
        );
  
      criterionResults.push({
        criterionId:
          "regression",
  
        passed:
          analyzeResult.exitCode === 0 &&
          fullTestResult.exitCode === 0,
  
        evidence: [
          ...commandEvidence(
            analyzeResult,
          ),
  
          ...commandEvidence(
            fullTestResult,
          ),
        ],
      });
  
      return criterionResults;
    }
  }