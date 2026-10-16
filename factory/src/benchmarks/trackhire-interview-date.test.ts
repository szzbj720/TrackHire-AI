import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  describe(
    "trackHireInterviewDateBenchmark",
    () => {
      it("defines the canonical TrackHire engineering task", () => {
        expect(
          trackHireInterviewDateBenchmark.task,
        ).toBe(
          "Add an optional interview date to a TrackHire application and display upcoming interviews.",
        );
  
        expect(
          trackHireInterviewDateBenchmark
            .requiresRealRepository,
        ).toBe(true);
      });
  
      it("targets the real TrackHire application architecture", () => {
        expect(
          trackHireInterviewDateBenchmark
            .repositoryFiles,
        ).toEqual([
          "lib/models/job_application.dart",
          "lib/providers/application_provider.dart",
          "lib/screens/add_edit_job_screen.dart",
          "test/job_application_test.dart",
        ]);
      });
  
      it("freezes the benchmark acceptance criteria", () => {
        const criterionIds =
          trackHireInterviewDateBenchmark
            .acceptanceCriteria
            .map(
              (criterion) =>
                criterion.id,
            );
  
        expect(criterionIds).toEqual([
          "optional-date",
          "persist-date",
          "edit-date",
          "upcoming-interviews",
          "regression",
        ]);
      });
  
      it("requires deterministic Flutter validation", () => {
        expect(
          trackHireInterviewDateBenchmark
            .validationCommands,
        ).toEqual([
          "flutter analyze",
          "flutter test",
        ]);
      });
  
      it("classifies the task as a high-complexity real repository benchmark", () => {
        expect(
          trackHireInterviewDateBenchmark
            .expectedComplexity,
        ).toBe("high");
  
        expect(
          trackHireInterviewDateBenchmark
            .expectedRisk,
        ).toBe("medium");
      });
    },
  );