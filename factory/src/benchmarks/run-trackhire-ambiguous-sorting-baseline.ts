import {
  resolve,
} from "node:path";

import {
  ModelTaskAnalyzer,
} from "../agents/analyzer.js";

import {
  OllamaProvider,
} from "../models/ollama-provider.js";

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
  type BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

import {
  ClarificationBenchmarkExecutor,
} from "./clarification-benchmark-executor.js";

import {
  DeterministicAcceptanceCollector,
} from "./deterministic-acceptance-collector.js";

import {
  trackHireAmbiguousSortingBenchmark,
} from "./trackhire-ambiguous-sorting.js";

import {
  TrackHireAmbiguousSortingVerifier,
} from "./trackhire-ambiguous-sorting-verifier.js";

function createValidator():
  DeterministicValidator {
  return new DeterministicValidator(
    new ProcessCommandRunner(),
    [
      {
        name:
          "flutter analyze lib",
        command:
          "flutter",
        args: [
          "analyze",
          "lib",
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
    `ambiguous-sorting-baseline-${Date.now()}`;

  const workspaceManager =
    new BenchmarkWorkspaceManager();

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

  const analyzer =
    new ModelTaskAnalyzer(
      benchmarkProvider,
    );

  const acceptanceCollector =
    new DeterministicAcceptanceCollector(
      new TrackHireAmbiguousSortingVerifier(),
    );

  let workspace:
    BenchmarkWorkspace | undefined;

  const executor =
    new ClarificationBenchmarkExecutor({
      runId,
      analyzer,
      acceptanceCollector,
      modelEvidence:
        benchmarkProvider,
      onWorkspaceReady(
        createdWorkspace,
      ) {
        workspace =
          createdWorkspace;
      },
    });

  const runner =
    new BenchmarkRunner(
      workspaceManager,
    );

  try {
    console.log(
      "Running TrackHire ambiguous-sorting analyzer baseline...",
    );

    const result =
      await runner.run({
        runId,
        scenario:
          trackHireAmbiguousSortingBenchmark,
        strategy:
          "exploration",
        repositoryRoot,
        baseRevision:
          "HEAD",
        executor,
        validator:
          createValidator(),
      });

    console.log("");

    console.log(
      `Baseline revision: ${result.baselineRevision}`,
    );

    console.log(
      `Validation: ${
        result.validation.passed
          ? "PASS"
          : "FAIL"
      }`,
    );

    console.log("");

    for (
      const criterion
      of result.acceptance.scores
    ) {
      console.log(
        `${criterion.criterionId.padEnd(38)} ${
          criterion.passed
            ? "PASS"
            : "FAIL"
        }`,
      );
    }

    console.log("");

    console.log(
      `Passed criteria: ${result.acceptance.passedCriteria}`,
    );

    console.log(
      `Failed criteria: ${result.acceptance.failedCriteria}`,
    );

    console.log(
      `Overall baseline: ${
        result.success
          ? "PASS"
          : "FAIL"
      }`,
    );

    console.log("");

    console.log(
      `Model input tokens: ${result.usage.inputTokens}`,
    );

    console.log(
      `Model output tokens: ${result.usage.outputTokens}`,
    );

    console.log(
      `Estimated cost USD: ${result.usage.estimatedCostUsd}`,
    );

    console.log(
      `Human interventions: ${result.humanInterventions}`,
    );

    console.log(
      `Duration ms: ${result.durationMs}`,
    );

    console.log("");

    console.log(
      result.acceptance.passed
        ? "The analyzer independently recognized that the request requires clarification."
        : "The analyzer did not cleanly recognize and stop for the ambiguous request.",
    );
  } finally {
    if (workspace) {
      await workspaceManager.cleanup({
        repositoryRoot,
        workspace,
      });

      console.log(
        "Benchmark workspace cleaned up.",
      );
    }
  }
}

main().catch(
  (error: unknown) => {
    if (error instanceof Error) {
      console.error(
        error.message,
      );
    } else {
      console.error(
        error,
      );
    }

    process.exitCode = 1;
  },
);
