import { resolve } from "node:path";

import { BenchmarkTaskAdapter } from "./benchmark-task-adapter.js";

import {
  BenchmarkWorkspaceManager,
  type BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";

import { BenchmarkFixtureManager } from "./benchmark-fixture-manager.js";

import { DeterministicAcceptanceCollector } from "./deterministic-acceptance-collector.js";

import { trackHireSaveErrorResponseBenchmark } from "./trackhire-save-error-response.js";

import { trackHireSaveErrorResponseBackendFixture } from "./trackhire-save-error-response-backend-fixture.js";

import { TrackHireSaveErrorResponseVerifier } from "./trackhire-save-error-response-verifier.js";

function formatCriterion(
  criterion: {
    criterionId: string;
    passed: boolean;
  },
): string {
  const status = criterion.passed
    ? "PASS"
    : "FAIL";

  return `${criterion.criterionId.padEnd(28)} ${status}`;
}

async function main(): Promise<void> {
  const repositoryRoot = resolve(
    process.cwd(),
    "..",
  );

  const runId =
    "save-error-response-baseline";

  const workspaceManager =
    new BenchmarkWorkspaceManager();

  const fixtureManager =
    new BenchmarkFixtureManager();

  let workspace:
    BenchmarkWorkspace | undefined;

  try {
    workspace =
      await workspaceManager.create({
        scenario:
          trackHireSaveErrorResponseBenchmark,
        runId,
        strategyId: "baseline",
        repositoryRoot,
        baseRevision: "HEAD",
      });

    const taskAdapter =
      new BenchmarkTaskAdapter();

    const task =
      taskAdapter.create({
        scenario:
          trackHireSaveErrorResponseBenchmark,
        runId,
      });

    const installedFixtures =
      await fixtureManager.install(
        workspace,
        [
          trackHireSaveErrorResponseBackendFixture,
        ],
      );

    const verifier =
      new TrackHireSaveErrorResponseVerifier();

    const collector =
      new DeterministicAcceptanceCollector(
        verifier,
      );

    console.log(
      "Running TrackHire saved-status error-response baseline...",
    );

    console.log(
      `Baseline revision: ${workspace.baselineRevision}`,
    );

    console.log(
      `Workspace: ${workspace.path}`,
    );

    const criteria =
      await collector.collect({
        scenario:
          trackHireSaveErrorResponseBenchmark,
        workspace,
        task,
      });

    await fixtureManager.assertUnchanged(
      workspace,
      installedFixtures,
    );

    console.log("");

    for (const criterion of criteria) {
      console.log(
        formatCriterion(criterion),
      );
    }

    const passedCriteria =
      criteria.filter(
        (criterion) =>
          criterion.passed,
      ).length;

    const failedCriteria =
      criteria.length -
      passedCriteria;

    const passed =
      failedCriteria === 0;

    console.log("");

    console.log(
      `Passed criteria: ${passedCriteria}`,
    );

    console.log(
      `Failed criteria: ${failedCriteria}`,
    );

    console.log(
      `Overall baseline: ${
        passed
          ? "PASS"
          : "FAIL"
      }`,
    );

    const fetchErrorResponse =
      criteria.find(
        (criterion) =>
          criterion.criterionId ===
          "save-fetch-error-response",
      );

    if (!fetchErrorResponse) {
      throw new Error(
        "Benchmark did not produce save-fetch-error-response.",
      );
    }

    if (fetchErrorResponse.passed) {
      throw new Error(
        "Untouched TrackHire unexpectedly passed the saved-status fetch-error response criterion.",
      );
    }

    const expectedPasses = [
      "save-success-contract",
      "save-not-found-contract",
      "regression",
    ];

    for (
      const criterionId
      of expectedPasses
    ) {
      const criterion =
        criteria.find(
          (candidate) =>
            candidate.criterionId ===
            criterionId,
        );

      if (!criterion) {
        throw new Error(
          `Benchmark did not produce ${criterionId}.`,
        );
      }

      if (!criterion.passed) {
        throw new Error(
          `Untouched TrackHire unexpectedly failed ${criterionId}.`,
        );
      }
    }

    if (passed) {
      throw new Error(
        "Untouched TrackHire unexpectedly passed the saved-status error-response benchmark.",
      );
    }

    console.log("");

    console.log(
      "Baseline control behaved as expected.",
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
