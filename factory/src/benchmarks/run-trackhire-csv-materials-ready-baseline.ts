import { resolve } from "node:path";
import { BenchmarkTaskAdapter } from "./benchmark-task-adapter.js";
import {
  BenchmarkWorkspaceManager,
  type BenchmarkWorkspace,
} from "./benchmark-workspace-manager.js";
import { BenchmarkFixtureManager } from "./benchmark-fixture-manager.js";
import { DeterministicAcceptanceCollector } from "./deterministic-acceptance-collector.js";
import { trackHireCsvMaterialsReadyBenchmark } from "./trackhire-csv-materials-ready.js";
import { trackHireCsvMaterialsReadyFixture } from "./trackhire-csv-materials-ready-fixture.js";
import { trackHireCsvMaterialsReadyExportFixture } from "./trackhire-csv-materials-ready-export-fixture.js";
import { TrackHireCsvMaterialsReadyVerifier } from "./trackhire-csv-materials-ready-verifier.js";

function formatCriterion(
  criterion: {
    criterionId: string;
    passed: boolean;
  },
): string {
  const status = criterion.passed
    ? "PASS"
    : "FAIL";

  return `${criterion.criterionId.padEnd(22)} ${status}`;
}

async function main(): Promise<void> {
  const repositoryRoot = resolve(
    process.cwd(),
    "..",
  );

  const runId =
    "csv-materials-ready-baseline";

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
          trackHireCsvMaterialsReadyBenchmark,
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
          trackHireCsvMaterialsReadyBenchmark,
        runId,
      });

    const installedFixtures =
      await fixtureManager.install(
        workspace,
        [
          trackHireCsvMaterialsReadyFixture,
          trackHireCsvMaterialsReadyExportFixture,
        ],
      );

    const verifier =
      new TrackHireCsvMaterialsReadyVerifier();

    const collector =
      new DeterministicAcceptanceCollector(
        verifier,
      );

    console.log(
      "Running TrackHire CSV materials-ready baseline...",
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
          trackHireCsvMaterialsReadyBenchmark,
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

    const featureCriteria = [
      "materials-header",
      "materials-value",
      "materials-edge-cases",
    ];

    const unexpectedFeaturePasses =
      criteria.filter(
        (criterion) =>
          featureCriteria.includes(
            criterion.criterionId,
          ) &&
          criterion.passed,
      );

    if (
      unexpectedFeaturePasses.length > 0
    ) {
      throw new Error(
        [
          "Untouched TrackHire unexpectedly passed feature criteria:",
          ...unexpectedFeaturePasses.map(
            (criterion) =>
              criterion.criterionId,
          ),
        ].join(" "),
      );
    }

    const regression =
      criteria.find(
        (criterion) =>
          criterion.criterionId ===
          "regression",
      );

    if (!regression) {
      throw new Error(
        "Benchmark did not produce a regression criterion.",
      );
    }

    if (!regression.passed) {
      throw new Error(
        "Untouched TrackHire failed its regression checks.",
      );
    }

    if (passed) {
      throw new Error(
        "Untouched TrackHire unexpectedly passed the CSV materials-ready benchmark.",
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