import {
    spawn,
  } from "node:child_process";
  
  import type {
    BenchmarkCriterionVerification,
    BenchmarkCriterionVerifier,
  } from "./deterministic-acceptance-collector.js";
  
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
  
  class ProcessBenchmarkCommandRunner
    implements BenchmarkCommandRunner {
    async run(
      command: string,
      args: string[],
      cwd: string,
    ): Promise<BenchmarkCommandResult> {
      return new Promise(
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
            (chunk: Buffer) => {
              stdout +=
                chunk.toString();
            },
          );
  
          child.stderr.on(
            "data",
            (chunk: Buffer) => {
              stderr +=
                chunk.toString();
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
  
  function formatCommand(
    result: BenchmarkCommandResult,
  ): string {
    return [
      result.command,
      ...result.args,
    ].join(" ");
  }
  
  function toEvidence(
    result: BenchmarkCommandResult,
  ): string[] {
    const command =
      formatCommand(result);
  
    if (result.exitCode === 0) {
      return [
        `${command} passed.`,
      ];
    }
  
    const details =
      [
        result.stderr.trim(),
        result.stdout.trim(),
      ]
        .filter(
          (value) =>
            value.length > 0,
        )
        .join("\n");
  
    if (details.length === 0) {
      return [
        `${command} failed with exit code ${result.exitCode}.`,
      ];
    }
  
    return [
      `${command} failed with exit code ${result.exitCode}.`,
      details,
    ];
  }
  
  export class TrackHireInterviewDateVerifier
    implements BenchmarkCriterionVerifier {
    constructor(
      private readonly commandRunner:
        BenchmarkCommandRunner =
          new ProcessBenchmarkCommandRunner(),
    ) {}
  
    async verify(input: Parameters<
      BenchmarkCriterionVerifier["verify"]
    >[0]): Promise<
      BenchmarkCriterionVerification[]
    > {
      if (
        input.scenario.id !==
        "trackhire-interview-date"
      ) {
        throw new Error(
          `TrackHireInterviewDateVerifier cannot verify scenario ${input.scenario.id}.`,
        );
      }
  
      const behavioralResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            "test/benchmark_interview_date_test.dart",
          ],
          input.workspace.path,
        );
  
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
  
      const behavioralPassed =
        behavioralResult.exitCode === 0;
  
      const regressionPassed =
        analyzeResult.exitCode === 0 &&
        fullTestResult.exitCode === 0;
  
      const behavioralEvidence =
        toEvidence(
          behavioralResult,
        );
  
      return [
        {
          criterionId:
            "optional-date",
  
          passed:
            behavioralPassed,
  
          evidence: [
            ...behavioralEvidence,
          ],
        },
  
        {
          criterionId:
            "persist-date",
  
          passed:
            behavioralPassed,
  
          evidence: [
            ...behavioralEvidence,
          ],
        },
  
        {
          criterionId:
            "edit-date",
  
          passed:
            behavioralPassed,
  
          evidence: [
            ...behavioralEvidence,
          ],
        },
  
        {
          criterionId:
            "upcoming-interviews",
  
          passed:
            behavioralPassed,
  
          evidence: [
            ...behavioralEvidence,
          ],
        },
  
        {
          criterionId:
            "regression",
  
          passed:
            regressionPassed,
  
          evidence: [
            ...toEvidence(
              analyzeResult,
            ),
  
            ...toEvidence(
              fullTestResult,
            ),
          ],
        },
      ];
    }
  }