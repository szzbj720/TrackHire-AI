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
  
  const scenarioId = "trackhire-ai-stale-state";
  
  const fixturePath =
    "test/factory_benchmark_ai_stale_state_test.dart";
  
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
  
  export class TrackHireAiStaleStateVerifier
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
          `TrackHireAiStaleStateVerifier cannot verify scenario ${input.scenario.id}.`,
        );
      }
  
      const clearStaleAnalysisResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "clear-stale-analysis",
          ],
          input.workspace.path,
        );
  
      const analysisValidationResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "analysis-validation",
          ],
          input.workspace.path,
        );
  
      const clearStaleResumeResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "clear-stale-resume",
          ],
          input.workspace.path,
        );
  
      const resumeValidationResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "resume-validation",
          ],
          input.workspace.path,
        );
  
      const successfulResultsResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "successful-results",
          ],
          input.workspace.path,
        );
  
      const clearAnalysisResult =
        await this.commandRunner.run(
          "flutter",
          [
            "test",
            fixturePath,
            "--plain-name",
            "clear-analysis",
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
          criterionId: "clear-stale-analysis",
          passed:
            clearStaleAnalysisResult.exitCode === 0,
          evidence: commandEvidence(
            clearStaleAnalysisResult,
            "Blank analysis input clears stale analysis state.",
          ),
        },
        {
          criterionId: "analysis-validation",
          passed:
            analysisValidationResult.exitCode === 0,
          evidence: commandEvidence(
            analysisValidationResult,
            "Analysis validation behavior passed.",
          ),
        },
        {
          criterionId: "clear-stale-resume",
          passed:
            clearStaleResumeResult.exitCode === 0,
          evidence: commandEvidence(
            clearStaleResumeResult,
            "Blank resume input clears stale tailored bullets.",
          ),
        },
        {
          criterionId: "resume-validation",
          passed:
            resumeValidationResult.exitCode === 0,
          evidence: commandEvidence(
            resumeValidationResult,
            "Resume validation behavior passed.",
          ),
        },
        {
          criterionId: "successful-results",
          passed:
            successfulResultsResult.exitCode === 0,
          evidence: commandEvidence(
            successfulResultsResult,
            "Valid AI requests continue to produce results.",
          ),
        },
        {
          criterionId: "clear-analysis",
          passed:
            clearAnalysisResult.exitCode === 0,
          evidence: commandEvidence(
            clearAnalysisResult,
            "clearAnalysis continues to reset AI state.",
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