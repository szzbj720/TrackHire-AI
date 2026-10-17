import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import {
    DeterministicAcceptanceCollector,
    type BenchmarkCriterionVerifier,
  } from "./deterministic-acceptance-collector.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  function createWorkspace():
    BenchmarkWorkspace {
    return {
      scenarioId:
        "trackhire-interview-date",
  
      runId:
        "benchmark-run-001",
  
      strategyId:
        "sequential",
  
      baselineRevision:
        "abc123",
  
      path:
        "/tmp/benchmark-worktree",
  
      branch:
        "factory/benchmark-sequential",
    };
  }
  
  function createTask():
    EngineeringTask {
    return {
      id:
        "trackhire-interview-date-run-001",
  
      request:
        trackHireInterviewDateBenchmark
          .task,
  
      status:
        "REVIEWING",
  
      requirements:
        trackHireInterviewDateBenchmark
          .acceptanceCriteria
          .map(
            (criterion) =>
              criterion.description,
          ),
  
      acceptanceCriteria:
        trackHireInterviewDateBenchmark
          .acceptanceCriteria
          .map(
            (criterion) =>
              criterion.verification,
          ),
  
      constraints: [],
  
      repairAttempts: 0,
  
      createdAt:
        "2026-10-16T21:00:00.000Z",
  
      updatedAt:
        "2026-10-16T21:00:00.000Z",
    };
  }
  
  describe(
    "DeterministicAcceptanceCollector",
    () => {
      it("preserves deterministic evidence for every benchmark criterion", async () => {
        const verifier:
          BenchmarkCriterionVerifier = {
            async verify() {
              return trackHireInterviewDateBenchmark
                .acceptanceCriteria
                .map(
                  (criterion) => ({
                    criterionId:
                      criterion.id,
  
                    passed: true,
  
                    evidence: [
                      `Verified ${criterion.id}`,
                    ],
                  }),
                );
            },
          };
  
        const collector =
          new DeterministicAcceptanceCollector(
            verifier,
          );
  
        const results =
          await collector.collect({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace:
              createWorkspace(),
  
            task:
              createTask(),
          });
  
        expect(
          results,
        ).toHaveLength(
          trackHireInterviewDateBenchmark
            .acceptanceCriteria
            .length,
        );
  
        expect(
          results.every(
            (result) =>
              result.passed,
          ),
        ).toBe(true);
  
        expect(
          results[0]?.evidence,
        ).toEqual([
          "Verified optional-date",
        ]);
      });
  
      it("fails a criterion when deterministic evidence is missing", async () => {
        const verifier:
          BenchmarkCriterionVerifier = {
            async verify() {
              return [
                {
                  criterionId:
                    "optional-date",
  
                  passed: true,
  
                  evidence: [
                    "Optional date verified.",
                  ],
                },
              ];
            },
          };
  
        const collector =
          new DeterministicAcceptanceCollector(
            verifier,
          );
  
        const results =
          await collector.collect({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace:
              createWorkspace(),
  
            task:
              createTask(),
          });
  
        const missing =
          results.find(
            (result) =>
              result.criterionId ===
              "persist-date",
          );
  
        expect(
          missing,
        ).toEqual({
          criterionId:
            "persist-date",
  
          passed:
            false,
  
          evidence: [
            "No deterministic acceptance evidence was produced.",
          ],
        });
      });
  
      it("preserves deterministic failure evidence", async () => {
        const verifier:
          BenchmarkCriterionVerifier = {
            async verify() {
              return [
                {
                  criterionId:
                    "upcoming-interviews",
  
                  passed: false,
  
                  evidence: [
                    "Upcoming interview ordering test failed.",
                  ],
                },
              ];
            },
          };
  
        const collector =
          new DeterministicAcceptanceCollector(
            verifier,
          );
  
        const results =
          await collector.collect({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace:
              createWorkspace(),
  
            task:
              createTask(),
          });
  
        const result =
          results.find(
            (criterion) =>
              criterion.criterionId ===
              "upcoming-interviews",
          );
  
        expect(
          result,
        ).toEqual({
          criterionId:
            "upcoming-interviews",
  
          passed:
            false,
  
          evidence: [
            "Upcoming interview ordering test failed.",
          ],
        });
      });
  
      it("rejects duplicate criterion verification evidence", async () => {
        const verifier:
          BenchmarkCriterionVerifier = {
            async verify() {
              return [
                {
                  criterionId:
                    "optional-date",
  
                  passed: true,
  
                  evidence: [
                    "First result.",
                  ],
                },
  
                {
                  criterionId:
                    "optional-date",
  
                  passed: true,
  
                  evidence: [
                    "Second result.",
                  ],
                },
              ];
            },
          };
  
        const collector =
          new DeterministicAcceptanceCollector(
            verifier,
          );
  
        await expect(
          collector.collect({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace:
              createWorkspace(),
  
            task:
              createTask(),
          }),
        ).rejects.toThrow(
          "Duplicate benchmark criterion verification: optional-date",
        );
      });
  
      it("returns results in frozen scenario order rather than verifier order", async () => {
        const verifier:
          BenchmarkCriterionVerifier = {
            async verify() {
              return [
                {
                  criterionId:
                    "regression",
  
                  passed: true,
  
                  evidence: [
                    "Regression checks passed.",
                  ],
                },
  
                {
                  criterionId:
                    "optional-date",
  
                  passed: true,
  
                  evidence: [
                    "Optional date verified.",
                  ],
                },
              ];
            },
          };
  
        const collector =
          new DeterministicAcceptanceCollector(
            verifier,
          );
  
        const results =
          await collector.collect({
            scenario:
              trackHireInterviewDateBenchmark,
  
            workspace:
              createWorkspace(),
  
            task:
              createTask(),
          });
  
        expect(
          results.map(
            (result) =>
              result.criterionId,
          ),
        ).toEqual([
          "optional-date",
          "persist-date",
          "edit-date",
          "upcoming-interviews",
          "regression",
        ]);
      });
    },
  );