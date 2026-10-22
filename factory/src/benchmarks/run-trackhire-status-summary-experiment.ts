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
    trackHireStatusSummaryBenchmark,
  } from "./trackhire-status-summary.js";
  
  import {
    TrackHireStatusSummaryVerifier,
  } from "./trackhire-status-summary-verifier.js";
  
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
      `ollama-status-summary-${Date.now()}`;
  
    const model =
      process.env.OLLAMA_MODEL ??
      "qwen2.5-coder:7b";
  
    const provider =
      new OllamaProvider({
        model,
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
        new TrackHireStatusSummaryVerifier(),
      );
  
    const plan = {
      summary:
        "Add application status summary support to TrackHire.",
  
      steps: [
        {
          order: 1,
          description:
            "Add provider support for deriving a count for every supported application status.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          rationale:
            "The provider owns the tracked application collection and should expose the derived status summary.",
        },
        {
          order: 2,
          description:
            "Ensure the status summary returns zero for supported statuses with no matching applications and updates when the application collection changes.",
          files: [
            "lib/providers/application_provider.dart",
          ],
          rationale:
            "The summary should be deterministic and derived from current application state.",
        },
        {
          order: 3,
          description:
            "Update existing tests as needed to cover status-summary behavior while preserving current application behavior.",
          files: [
            "test/job_application_test.dart",
          ],
          rationale:
            "The new behavior should be covered without regressing existing functionality.",
        },
      ],
  
      affectedFiles: [
        "lib/providers/application_provider.dart",
        "test/job_application_test.dart",
      ],
  
      validationSteps: [
        "flutter analyze lib backend",
        "flutter test",
      ],
  
      risks: [
        "The implementation must use the application statuses already supported by TrackHire.",
        "Statuses with no matching applications must still be represented with zero.",
        "The summary must always reflect the current application collection rather than stale cached state.",
      ],
  
      assumptions: [
        "The status summary is derived from the provider's current application collection.",
        "Existing TrackHire application behavior must remain valid.",
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
      "Scenario: TrackHire application status summary",
    );
  
    console.log(
      "Strategy: sequential implementation",
    );
  
    console.log(
      "Model:",
      model,
    );
  
    console.log(
      "\nRunning AI implementation against an isolated TrackHire workspace...\n",
    );
  
    const result =
      await runner.run({
        runId,
  
        scenario:
          trackHireStatusSummaryBenchmark,
  
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
  
          scenario:
            trackHireStatusSummaryBenchmark.id,
  
          model,
  
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