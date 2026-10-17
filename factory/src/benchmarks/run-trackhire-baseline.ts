import {
    resolve,
  } from "node:path";
  
  import {
    BenchmarkTaskAdapter,
  } from "./benchmark-task-adapter.js";
  
  import {
    BenchmarkWorkspaceManager,
    type BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import {
    TrackHireBaseline,
  } from "./trackhire-baseline.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  function formatCriterion(
    criterion: {
      criterionId: string;
      passed: boolean;
    },
  ): string {
    const status =
      criterion.passed
        ? "PASS"
        : "FAIL";
  
    return `${criterion.criterionId.padEnd(20)} ${status}`;
  }
  
  async function main():
    Promise<void> {
    const repositoryRoot =
      resolve(
        process.cwd(),
        "..",
      );
  
    const runId =
      "real-baseline";
  
    const workspaceManager =
      new BenchmarkWorkspaceManager();
  
    let workspace:
      BenchmarkWorkspace | undefined;
  
    try {
      workspace =
        await workspaceManager.create({
          scenario:
            trackHireInterviewDateBenchmark,
  
          runId,
  
          strategyId:
            "baseline",
  
          repositoryRoot,
  
          baseRevision:
            "HEAD",
        });
  
      const taskAdapter =
        new BenchmarkTaskAdapter();
  
      const task =
        taskAdapter.create({
          scenario:
            trackHireInterviewDateBenchmark,
  
          runId,
        });
  
      const baseline =
        new TrackHireBaseline();
  
      console.log(
        "Running real TrackHire benchmark baseline...",
      );
  
      console.log(
        `Baseline revision: ${workspace.baselineRevision}`,
      );
  
      console.log(
        `Workspace: ${workspace.path}`,
      );
  
      const result =
        await baseline.run({
          scenario:
            trackHireInterviewDateBenchmark,
  
          workspace,
  
          task,
        });
  
      console.log("");
  
      for (
        const criterion
        of result.criteria
      ) {
        console.log(
          formatCriterion(
            criterion,
          ),
        );
      }
  
      console.log("");
  
      console.log(
        `Passed criteria: ${result.passedCriteria}`,
      );
  
      console.log(
        `Failed criteria: ${result.failedCriteria}`,
      );
  
      console.log(
        `Overall baseline: ${
          result.passed
            ? "PASS"
            : "FAIL"
        }`,
      );
  
      const featureCriteria = [
        "optional-date",
        "persist-date",
        "upcoming-interviews",
        "edit-date",
      ];
  
      const unexpectedFeaturePasses =
        result.criteria.filter(
          (criterion) =>
            featureCriteria.includes(
              criterion.criterionId,
            ) &&
            criterion.passed,
        );
  
      if (
        unexpectedFeaturePasses.length >
        0
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
        result.criteria.find(
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
  
      if (result.passed) {
        throw new Error(
          "Untouched TrackHire unexpectedly passed the interview-date benchmark.",
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
      if (
        error instanceof Error
      ) {
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