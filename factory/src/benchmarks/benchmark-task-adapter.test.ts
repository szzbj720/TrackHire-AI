import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    BenchmarkTaskAdapter,
  } from "./benchmark-task-adapter.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  describe(
    "BenchmarkTaskAdapter",
    () => {
      it("converts the TrackHire benchmark into a real factory engineering task", () => {
        const adapter =
          new BenchmarkTaskAdapter({
            isoNow() {
              return "2026-10-16T21:00:00.000Z";
            },
          });
  
        const task =
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "sequential-001",
          });
  
        expect(task).toEqual({
          id:
            "trackhire-interview-date-sequential-001",
  
          request:
            "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  
          status:
            "TASK_CREATED",
  
          requirements: [
            "A job application can exist without an interview date.",
            "An interview date survives application serialization and deserialization.",
            "Users can add or edit an interview date.",
            "Upcoming interviews can be derived from tracked applications.",
            "Existing TrackHire behavior remains valid.",
          ],
  
          acceptanceCriteria: [
            "Model tests confirm existing applications remain valid when no interview date is present.",
            "Model tests confirm database and API conversions preserve the interview date.",
            "The add/edit application flow exposes optional interview date input.",
            "Provider tests confirm future interview dates are returned in chronological order and applications without upcoming interviews are excluded.",
            "Flutter analysis and the existing test suite pass.",
          ],
  
          constraints: [
            "Repository scope: lib/models/job_application.dart, lib/providers/application_provider.dart, lib/screens/add_edit_job_screen.dart, test/job_application_test.dart",
            "Expected complexity: high",
            "Expected risk: medium",
            "Validation command: flutter analyze",
            "Validation command: flutter test",
          ],
  
          repairAttempts: 0,
  
          createdAt:
            "2026-10-16T21:00:00.000Z",
  
          updatedAt:
            "2026-10-16T21:00:00.000Z",
        });
      });
  
      it("preserves every benchmark acceptance requirement", () => {
        const adapter =
          new BenchmarkTaskAdapter({
            isoNow() {
              return "2026-10-16T21:00:00.000Z";
            },
          });
  
        const task =
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "run-001",
          });
  
        expect(
          task.requirements,
        ).toHaveLength(
          trackHireInterviewDateBenchmark
            .acceptanceCriteria
            .length,
        );
  
        expect(
          task.acceptanceCriteria,
        ).toHaveLength(
          trackHireInterviewDateBenchmark
            .acceptanceCriteria
            .length,
        );
      });
  
      it("preserves the benchmark repository scope as factory constraints", () => {
        const adapter =
          new BenchmarkTaskAdapter({
            isoNow() {
              return "2026-10-16T21:00:00.000Z";
            },
          });
  
        const task =
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "run-001",
          });
  
        expect(
          task.constraints,
        ).toContain(
          "Repository scope: lib/models/job_application.dart, lib/providers/application_provider.dart, lib/screens/add_edit_job_screen.dart, test/job_application_test.dart",
        );
      });
  
      it("preserves deterministic validation commands as factory constraints", () => {
        const adapter =
          new BenchmarkTaskAdapter({
            isoNow() {
              return "2026-10-16T21:00:00.000Z";
            },
          });
  
        const task =
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "run-001",
          });
  
        expect(
          task.constraints,
        ).toContain(
          "Validation command: flutter analyze",
        );
  
        expect(
          task.constraints,
        ).toContain(
          "Validation command: flutter test",
        );
      });
  
      it("supports an explicitly frozen creation timestamp", () => {
        const adapter =
          new BenchmarkTaskAdapter();
  
        const task =
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "run-001",
  
            createdAt:
              "2026-01-01T00:00:00.000Z",
          });
  
        expect(
          task.createdAt,
        ).toBe(
          "2026-01-01T00:00:00.000Z",
        );
  
        expect(
          task.updatedAt,
        ).toBe(
          "2026-01-01T00:00:00.000Z",
        );
      });
  
      it("rejects an empty benchmark run ID", () => {
        const adapter =
          new BenchmarkTaskAdapter();
  
        expect(() =>
          adapter.create({
            scenario:
              trackHireInterviewDateBenchmark,
  
            runId:
              "   ",
          }),
        ).toThrow(
          "Benchmark run ID cannot be empty.",
        );
      });
    },
  );