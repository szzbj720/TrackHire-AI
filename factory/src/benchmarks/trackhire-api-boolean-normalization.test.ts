import { describe, expect, it } from "vitest";

import { trackHireApiBooleanNormalizationBenchmark } from "./trackhire-api-boolean-normalization.js";

describe("trackHireApiBooleanNormalizationBenchmark", () => {
  it("defines the expected scenario identity and metadata", () => {
    expect(
      trackHireApiBooleanNormalizationBenchmark.id,
    ).toBe(
      "trackhire-api-boolean-normalization",
    );

    expect(
      trackHireApiBooleanNormalizationBenchmark.category,
    ).toBe("cross-layer");

    expect(
      trackHireApiBooleanNormalizationBenchmark.difficulty,
    ).toBe("medium");

    expect(
      trackHireApiBooleanNormalizationBenchmark.expectedBehavior,
    ).toBe("implement");

    expect(
      trackHireApiBooleanNormalizationBenchmark.expectedComplexity,
    ).toBe("medium");

    expect(
      trackHireApiBooleanNormalizationBenchmark.expectedRisk,
    ).toBe("medium");

    expect(
      trackHireApiBooleanNormalizationBenchmark.requiresRealRepository,
    ).toBe(true);
  });

  it("targets API contract and type robustness failures", () => {
    expect(
      trackHireApiBooleanNormalizationBenchmark.failureModes,
    ).toEqual(
      expect.arrayContaining([
        "type-contract",
        "api-mismatch",
        "edge-case",
        "regression",
        "repository-convention",
      ]),
    );
  });

  it("identifies the relevant TrackHire repository files", () => {
    expect(
      trackHireApiBooleanNormalizationBenchmark.repositoryFiles,
    ).toEqual([
      "lib/models/job_application.dart",
      "lib/services/api_service.dart",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireApiBooleanNormalizationBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "integer-booleans",
      "native-booleans",
      "missing-booleans",
      "non-boolean-fields",
      "database-deserialization",
      "regression",
    ]);
  });

  it("gives every acceptance criterion a verification method", () => {
    for (
      const criterion
      of trackHireApiBooleanNormalizationBenchmark.acceptanceCriteria
    ) {
      expect(
        criterion.verification.length,
      ).toBeGreaterThan(0);
    }
  });

  it("uses the standard Flutter validation commands", () => {
    expect(
      trackHireApiBooleanNormalizationBenchmark.validationCommands,
    ).toEqual([
      "flutter analyze lib",
      "flutter test",
    ]);
  });
});
