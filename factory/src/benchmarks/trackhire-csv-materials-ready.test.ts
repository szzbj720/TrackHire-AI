import { describe, expect, it } from "vitest";

import { trackHireCsvMaterialsReadyBenchmark } from "./trackhire-csv-materials-ready.js";

describe("trackHireCsvMaterialsReadyBenchmark", () => {
  it("defines the expected benchmark identity and metadata", () => {
    expect(trackHireCsvMaterialsReadyBenchmark.id).toBe(
      "trackhire-csv-materials-ready",
    );
    expect(trackHireCsvMaterialsReadyBenchmark.category).toBe(
      "localized-change",
    );
    expect(trackHireCsvMaterialsReadyBenchmark.difficulty).toBe("easy");
    expect(trackHireCsvMaterialsReadyBenchmark.expectedBehavior).toBe(
      "implement",
    );
    expect(trackHireCsvMaterialsReadyBenchmark.expectedComplexity).toBe("low");
    expect(trackHireCsvMaterialsReadyBenchmark.expectedRisk).toBe("low");
    expect(trackHireCsvMaterialsReadyBenchmark.requiresRealRepository).toBe(
      true,
    );
  });

  it("targets localized export failure modes", () => {
    expect(trackHireCsvMaterialsReadyBenchmark.failureModes).toEqual([
      "edge-case",
      "regression",
      "repository-convention",
    ]);
  });

  it("keeps the repository scope focused on CSV export behavior", () => {
    expect(trackHireCsvMaterialsReadyBenchmark.repositoryFiles).toEqual([
      "lib/services/csv_export_service.dart",
      "lib/models/job_application.dart",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireCsvMaterialsReadyBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "materials-header",
      "materials-value",
      "materials-edge-cases",
      "preserve-columns",
      "regression",
    ]);
  });

  it("uses the standard Flutter validation commands", () => {
    expect(trackHireCsvMaterialsReadyBenchmark.validationCommands).toEqual([
      "flutter analyze",
      "flutter test",
    ]);
  });
});