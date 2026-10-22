import {
    mkdir,
    writeFile,
  } from "node:fs/promises";
  
  import {
    resolve,
  } from "node:path";
  
  import {
    ModelBuilder,
  } from "../agents/builder.js";
  
  import {
    ModelDiagnostician,
  } from "../agents/diagnostician.js";
  
  import {
    ModelRepairer,
  } from "../agents/repairer.js";
  
  import {
    OllamaProvider,
  } from "../models/ollama-provider.js";
  
  import {
    DiagnosisWorkflow,
  } from "../orchestrator/diagnosis-workflow.js";
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  import {
    RepairWorkflow,
  } from "../orchestrator/repair-workflow.js";
  
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  
  import {
    ProcessCommandRunner,
  } from "../validation/command-runner.js";
  
  import {
    DeterministicValidator,
  } from "../validation/validator.js";
  
  import {
    BenchmarkExperiment,
  } from "./benchmark-experiment.js";
  
  import {
    BenchmarkModelProvider,
  } from "./benchmark-model-provider.js";
  
  import {
    BenchmarkRunner,
  } from "./benchmark-runner.js";
  
  import {
    BenchmarkWorkspaceManager,
  } from "./benchmark-workspace-manager.js";
  
  import {
    DeterministicAcceptanceCollector,
  } from "./deterministic-acceptance-collector.js";
  
  import {
    LightweightBenchmarkExecutor,
  } from "./lightweight-benchmark-executor.js";
  
  import {
    SequentialBenchmarkExecutor,
  } from "./sequential-benchmark-executor.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import {
    TrackHireInterviewDateVerifier,
  } from "./trackhire-interview-date-verifier.js";
  
  function createValidator():
    DeterministicValidator {
    return new DeterministicValidator(
      new ProcessCommandRunner(),
      [
        {
          name:
            "flutter analyze",
          command:
            "flutter",
          args: [
            "analyze",
            "lib",
            "backend",
          ],
        },
        {
          name:
            "flutter test",
          command:
            "flutter",
          args: [
            "test",
          ],
        },
      ],
    );
  }
  
  function createPlan():
    ImplementationPlan {
    return {
      summary:
        "Add optional interview scheduling support to TrackHire.",
  
      steps: [
        {
          order: 1,
          description:
            "Add an optional interview date to the job application model and preserve it through serialization and deserialization.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The model must represent and persist the optional interview date.",
        },
        {
          order: 2,
          description:
            "Add provider support for deriving upcoming interviews in chronological order.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          rationale:
            "The application needs a deterministic way to derive upcoming interviews.",
        },
        {
          order: 3,
          description:
            "Add optional interview date input to the add/edit application flow.",
          files: [
            "lib/screens/add_edit_job_screen.dart",
          ],
          rationale:
            "Users need to be able to add and edit the interview date.",
        },
        {
          order: 4,
          description:
            "Update the existing job application tests for optional interview date behavior and serialization.",
          files: [
            "test/job_application_test.dart",
          ],
          rationale:
            "The new model behavior should be covered while preserving existing behavior.",
        },
      ],
  
      affectedFiles: [
        "lib/models/job_application.dart",
        "lib/providers/application_provider.dart",
        "lib/screens/add_edit_job_screen.dart",
        "test/job_application_test.dart",
      ],
  
      validationSteps: [
        "flutter analyze lib backend",
        "flutter test",
      ],
  
      risks: [
        "Date serialization must remain backward compatible with existing applications.",
        "Upcoming interview filtering must exclude missing or past dates.",
      ],
  
      assumptions: [
        "Interview dates are optional.",
        "Existing TrackHire application data must remain valid.",
      ],
  
      requiresHumanInput:
        false,
    };
  }
  
  async function main():
    Promise<void> {
    const repositoryRoot =
      resolve(
        process.cwd(),
        "..",
      );
  
    const experimentId =
      `trackhire-strategy-${Date.now()}`;
  
    const model =
      process.env.OLLAMA_MODEL ??
      "qwen2.5-coder:7b";
  
    const plan =
      createPlan();
  
    const lightweightProvider =
      new BenchmarkModelProvider(
        new OllamaProvider({
          model,
        }),
      );
  
    const sequentialProvider =
      new BenchmarkModelProvider(
        new OllamaProvider({
          model,
        }),
      );
  
    const lightweightValidator =
      createValidator();
  
    const sequentialValidator =
      createValidator();
  
    const acceptanceCollector =
      new DeterministicAcceptanceCollector(
        new TrackHireInterviewDateVerifier(),
      );
  
    const lightweightBuilder =
      new ModelBuilder(
        lightweightProvider,
      );
  
    const sequentialBuilder =
      new ModelBuilder(
        sequentialProvider,
      );
  
    const sequentialDiagnostician =
      new ModelDiagnostician(
        sequentialProvider,
      );
  
    const sequentialRepairer =
      new ModelRepairer(
        sequentialProvider,
      );
  
    const lightweightExecutor =
      new LightweightBenchmarkExecutor({
        runId:
          `${experimentId}-lightweight`,
  
        plan,
  
        builder:
          lightweightBuilder,
  
        validator:
          lightweightValidator,
  
        acceptanceCollector,
  
        modelEvidence:
          lightweightProvider,
      });
  
    const sequentialWorkflow =
      new ImplementationWorkflow(
        sequentialBuilder,
        sequentialValidator,
      );
  
    const diagnosisWorkflow =
      new DiagnosisWorkflow(
        sequentialDiagnostician,
      );
  
    const repairWorkflow =
      new RepairWorkflow(
        sequentialRepairer,
        sequentialValidator,
        2,
      );
  
    const sequentialExecutor =
      new SequentialBenchmarkExecutor({
        runId:
          `${experimentId}-sequential`,
  
        plan,
  
        implementationWorkflow:
          sequentialWorkflow,
  
        diagnosisWorkflow,
  
        repairWorkflow,
  
        acceptanceCollector,
  
        modelEvidence:
          sequentialProvider,
  
        maxRecoveryCycles:
          2,
      });
  
    const experiment =
      new BenchmarkExperiment(
        new BenchmarkRunner(
          new BenchmarkWorkspaceManager(),
        ),
      );
  
    console.log(
      "\n=== TrackHire Strategy Comparison ===\n",
    );
  
    console.log(
      `Model: ${model}`,
    );
  
    console.log(
      "Scenario: TrackHire interview date",
    );
  
    console.log(
      "Lightweight: build -> validate -> stop",
    );
  
    console.log(
      "Sequential: build -> validate -> diagnose -> bounded repair -> revalidate",
    );
  
    console.log(
      "\nStarting experiment. This may take several minutes...\n",
    );
  
    const startedAt =
      Date.now();
  
    const result =
      await experiment.run({
        experimentId,
  
        scenario:
          trackHireInterviewDateBenchmark,
  
        repositoryRoot,
  
        baseRevision:
          "HEAD",
  
        targets: [
          {
            strategy:
              "lightweight",
  
            executor:
              lightweightExecutor,
  
            validator:
              lightweightValidator,
          },
          {
            strategy:
              "sequential",
  
            executor:
              sequentialExecutor,
  
            validator:
              sequentialValidator,
          },
        ],
      });
  
    const totalDurationSeconds =
      (
        (
          Date.now() -
          startedAt
        ) /
        1000
      ).toFixed(1);
  
    console.log(
      `\nExperiment completed in ${totalDurationSeconds}s.`,
    );
  
    console.log(
      "\n=== Comparison ===\n",
    );
  
    for (
      const run
      of result.results
    ) {
      console.log(
        `${run.strategy.toUpperCase()}`,
      );
  
      console.log(
        `  Success: ${run.success ? "PASS" : "FAIL"}`,
      );
  
      console.log(
        `  Validation: ${run.validation.passed ? "PASS" : "FAIL"}`,
      );
  
      console.log(
        `  Acceptance: ${run.acceptance.passedCriteria}/${run.acceptance.totalCriteria}`,
      );
  
      console.log(
        `  Duration: ${(run.durationMs / 1000).toFixed(1)}s`,
      );
  
      console.log(
        `  Input tokens: ${run.usage.inputTokens}`,
      );
  
      console.log(
        `  Output tokens: ${run.usage.outputTokens}`,
      );
  
      console.log(
        `  Estimated cost: $${run.usage.estimatedCostUsd.toFixed(4)}`,
      );
  
      console.log(
        `  Human interventions: ${run.humanInterventions}`,
      );
  
      console.log("");
    }
  
    const resultsDirectory =
      resolve(
        process.cwd(),
        "benchmark-results",
      );
  
    await mkdir(
      resultsDirectory,
      {
        recursive: true,
      },
    );
  
    const resultPath =
      resolve(
        resultsDirectory,
        `${experimentId}.json`,
      );
  
    await writeFile(
      resultPath,
      JSON.stringify(
        {
          experimentVersion:
            2,
  
          experimentType:
            "lightweight-vs-bounded-recovery",
  
          model,
  
          experiment:
            result,
        },
        null,
        2,
      ),
      "utf8",
    );
  
    console.log(
      `Experiment record: ${resultPath}`,
    );
  
    console.log(
      "\nWorkspaces:",
    );
  
    for (
      const run
      of result.results
    ) {
      console.log(
        `${run.strategy}: ${run.workspacePath}`,
      );
    }
  }
  
  main().catch(
    (
      error: unknown,
    ) => {
      const message =
        error instanceof Error
          ? error.message
          : String(
              error,
            );
  
      console.error(
        `\nStrategy comparison failed: ${message}`,
      );
  
      process.exitCode = 1;
    },
  );