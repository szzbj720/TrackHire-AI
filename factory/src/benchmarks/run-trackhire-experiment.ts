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
    OllamaProvider,
  } from "../models/ollama-provider.js";
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  import {
    ProcessCommandRunner,
  } from "../validation/command-runner.js";
  
  import {
    DeterministicValidator,
  } from "../validation/validator.js";
  
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
  
  async function main():
    Promise<void> {
    const repositoryRoot =
      resolve(
        process.cwd(),
        "..",
      );
  
    const runId =
      `ollama-sequential-${Date.now()}`;
  
    const provider =
      new OllamaProvider({
        model:
          process.env.OLLAMA_MODEL ??
          "qwen2.5-coder:7b",
      });
  
    const benchmarkProvider =
      new BenchmarkModelProvider(
        provider,
      );
  
    const validator =
      createValidator();
  
    const implementationWorkflow =
      new ImplementationWorkflow(
        new ModelBuilder(
          benchmarkProvider,
        ),
        validator,
      );
  
    const acceptanceCollector =
      new DeterministicAcceptanceCollector(
        new TrackHireInterviewDateVerifier(),
      );
  
    const plan = {
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
  
    const executor =
      new SequentialBenchmarkExecutor({
        runId,
        plan,
        implementationWorkflow,
        acceptanceCollector,
        modelEvidence:
          benchmarkProvider,
      });
  
    const runner =
      new BenchmarkRunner(
        new BenchmarkWorkspaceManager(),
      );
  
    console.log(
      "\n=== TrackHire AI Factory Experiment ===\n",
    );
  
    console.log(
      "Scenario: TrackHire interview date",
    );
  
    console.log(
      "Strategy: sequential implementation",
    );
  
    console.log(
      "Model:",
      process.env.OLLAMA_MODEL ??
        "qwen2.5-coder:7b",
    );
  
    console.log(
      "\nRunning AI implementation against an isolated TrackHire workspace...\n",
    );
  
    const result =
      await runner.run({
        runId,
  
        scenario:
          trackHireInterviewDateBenchmark,
  
        strategy:
          "sequential",
  
        repositoryRoot,
  
        baseRevision:
          "HEAD",
  
        executor,
  
        validator,
      });
  
    console.log(
      "=== Experiment Result ===\n",
    );
  
    console.log(
      `Baseline revision: ${result.baselineRevision}`,
    );
  
    console.log(
      `Success: ${result.success ? "PASS" : "FAIL"}`,
    );
  
    console.log(
      `Deterministic validation: ${result.validation.passed ? "PASS" : "FAIL"}`,
    );
  
    console.log(
      `Acceptance criteria: ${result.acceptance.passedCriteria}/${result.acceptance.totalCriteria}`,
    );
  
    console.log(
      `Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
    );
  
    console.log(
      `Input tokens: ${result.usage.inputTokens}`,
    );
  
    console.log(
      `Output tokens: ${result.usage.outputTokens}`,
    );
  
    console.log(
      `Estimated model cost: $${result.usage.estimatedCostUsd.toFixed(4)}`,
    );
  
    console.log(
      `Human interventions: ${result.humanInterventions}`,
    );
  
    console.log(
      "\nAcceptance scores:",
    );
  
    for (
      const score
      of result.acceptance.scores
    ) {
      console.log(
        `${score.criterionId.padEnd(22)} ${score.passed ? "PASS" : "FAIL"}`,
      );
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
        `${runId}.json`,
      );
  
    await writeFile(
      resultPath,
      JSON.stringify(
        {
          experimentVersion:
            1,
  
          model:
            process.env.OLLAMA_MODEL ??
            "qwen2.5-coder:7b",
  
          result,
        },
        null,
        2,
      ),
      "utf8",
    );
  
    console.log(
      "\nExperiment record:",
    );
  
    console.log(
      resultPath,
    );
  
    console.log(
      "\nWorkspace preserved for inspection:",
    );
  
    console.log(
      result.workspacePath,
    );
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
        `\nBenchmark experiment failed: ${message}`,
      );
  
      process.exitCode = 1;
    },
  );