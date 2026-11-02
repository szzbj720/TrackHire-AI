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
  
  const scenarioId = "trackhire-csv-materials-ready";
  
  const modelFixturePath =
    "test/factory_benchmark_csv_materials_ready_test.dart";
  
  const exportFixturePath =
    "factory_benchmark_csv_materials_ready_test.js";
  
  const existingRegressionTestPath = "test/job_application_test.dart";
  
  function commandEvidence(
    result: BenchmarkCommandResult,
    successMessage: string,
  ): string[] {
    if (result.exitCode === 0) {
      return [successMessage];
    }
  
    const evidence = [`Command exited with code ${result.exitCode}.`];
  
    if (result.stdout.trim().length > 0) {
      evidence.push(result.stdout.trim());
    }
  
    if (result.stderr.trim().length > 0) {
      evidence.push(result.stderr.trim());
    }
  
    return evidence;
  }
  
  export class TrackHireCsvMaterialsReadyVerifier
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
          `TrackHireCsvMaterialsReadyVerifier cannot verify scenario ${input.scenario.id}.`,
        );
      }
  
      const modelResult = await this.commandRunner.run(
        "flutter",
        [
          "test",
          modelFixturePath,
          "--plain-name",
          "materials-count",
        ],
        input.workspace.path,
      );
  
      const exportResult = await this.commandRunner.run(
        "node",
        [exportFixturePath],
        input.workspace.path,
      );
  
      const analysisResult = await this.commandRunner.run(
        "flutter",
        ["analyze", "lib"],
        input.workspace.path,
      );
  
      const regressionTestResult = await this.commandRunner.run(
        "flutter",
        ["test", existingRegressionTestPath],
        input.workspace.path,
      );
  
      const exportBehaviorPassed =
        modelResult.exitCode === 0 &&
        exportResult.exitCode === 0;
  
      const regressionPassed =
        analysisResult.exitCode === 0 &&
        regressionTestResult.exitCode === 0;
  
      return [
        {
          criterionId: "materials-header",
          passed: exportResult.exitCode === 0,
          evidence: commandEvidence(
            exportResult,
            "CSV export contains the Materials Ready header.",
          ),
        },
        {
          criterionId: "materials-value",
          passed: exportBehaviorPassed,
          evidence: exportBehaviorPassed
            ? [
                "The model exposes completed-material counts and the CSV export writes them in X/5 format.",
              ]
            : [
                ...commandEvidence(
                  modelResult,
                  "Material-count behavior passed.",
                ),
                ...commandEvidence(
                  exportResult,
                  "CSV export contract passed.",
                ),
              ],
        },
        {
          criterionId: "materials-edge-cases",
          passed: exportBehaviorPassed,
          evidence: exportBehaviorPassed
            ? [
                "Zero, partial, and complete material counts are supported and the CSV export writes the count in X/5 format.",
              ]
            : [
                ...commandEvidence(
                  modelResult,
                  "Zero, partial, and complete material-count cases passed.",
                ),
                ...commandEvidence(
                  exportResult,
                  "CSV export contract passed.",
                ),
              ],
        },
        {
          criterionId: "preserve-columns",
          passed: exportResult.exitCode === 0,
          evidence: commandEvidence(
            exportResult,
            "Existing CSV headers and application values remain present.",
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