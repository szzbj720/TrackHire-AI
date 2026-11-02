import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireApplicationSourceBenchmark,
  } from "./trackhire-application-source.js";
  
  describe(
    "TrackHire application source benchmark",
    () => {
      it("defines a persistence-focused hard scenario", () => {
        expect(
          trackHireApplicationSourceBenchmark.id,
        ).toBe(
          "trackhire-application-source",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.category,
        ).toBe("persistence");
  
        expect(
          trackHireApplicationSourceBenchmark.difficulty,
        ).toBe("hard");
  
        expect(
          trackHireApplicationSourceBenchmark.expectedBehavior,
        ).toBe("implement");
      });
  
      it("targets cross-layer persistence failures", () => {
        expect(
          trackHireApplicationSourceBenchmark.failureModes,
        ).toContain(
          "persistence-loss",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.failureModes,
        ).toContain(
          "api-mismatch",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.failureModes,
        ).toContain(
          "cross-file-inconsistency",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.failureModes,
        ).toContain(
          "regression",
        );
      });
  
      it("covers the Flutter and backend contract", () => {
        expect(
          trackHireApplicationSourceBenchmark.repositoryFiles,
        ).toContain(
          "lib/models/job_application.dart",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.repositoryFiles,
        ).toContain(
          "lib/services/api_service.dart",
        );
  
        expect(
          trackHireApplicationSourceBenchmark.repositoryFiles,
        ).toContain(
          "backend/server.js",
        );
      });
  
      it("defines the expected acceptance criteria", () => {
        const criterionIds =
          trackHireApplicationSourceBenchmark
            .acceptanceCriteria
            .map(
              (criterion) =>
                criterion.id,
            );
  
        expect(criterionIds).toEqual([
          "optional-source",
          "serialize-source",
          "create-source",
          "update-source",
          "reload-source",
          "regression",
        ]);
      });
  
      it("requires real repository validation", () => {
        expect(
          trackHireApplicationSourceBenchmark
            .requiresRealRepository,
        ).toBe(true);
  
        expect(
          trackHireApplicationSourceBenchmark
            .validationCommands,
        ).toContain(
          "flutter analyze",
        );
  
        expect(
          trackHireApplicationSourceBenchmark
            .validationCommands,
        ).toContain(
          "flutter test",
        );
      });
    },
  );