import { describe, expect, it } from "vitest";

import {
  trackHireSaveErrorResponseBenchmark,
} from "./trackhire-save-error-response.js";

describe("trackHireSaveErrorResponseBenchmark", () => {
  it("defines the saved-status error-response benchmark", () => {
    expect(
      trackHireSaveErrorResponseBenchmark.id,
    ).toBe("trackhire-save-error-response");

    expect(
      trackHireSaveErrorResponseBenchmark.category,
    ).toBe("regression");

    expect(
      trackHireSaveErrorResponseBenchmark.difficulty,
    ).toBe("medium");

    expect(
      trackHireSaveErrorResponseBenchmark.expectedBehavior,
    ).toBe("implement");

    expect(
      trackHireSaveErrorResponseBenchmark.expectedComplexity,
    ).toBe("low");

    expect(
      trackHireSaveErrorResponseBenchmark.expectedRisk,
    ).toBe("medium");

    expect(
      trackHireSaveErrorResponseBenchmark.requiresRealRepository,
    ).toBe(true);
  });

  it("targets the backend saved-status route", () => {
    expect(
      trackHireSaveErrorResponseBenchmark.repositoryFiles,
    ).toEqual([
      "backend/server.js",
      "lib/services/api_service.dart",
    ]);

    expect(
      trackHireSaveErrorResponseBenchmark.failureModes,
    ).toEqual([
      "regression",
      "edge-case",
      "repository-convention",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireSaveErrorResponseBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "save-fetch-error-response",
      "save-success-contract",
      "save-not-found-contract",
      "regression",
    ]);

    for (
      const criterion
      of trackHireSaveErrorResponseBenchmark.acceptanceCriteria
    ) {
      expect(criterion.description.length).toBeGreaterThan(0);
      expect(criterion.verification.length).toBeGreaterThan(0);
    }
  });

  it("defines deterministic validation commands", () => {
    expect(
      trackHireSaveErrorResponseBenchmark.validationCommands,
    ).toEqual([
      "node --check backend/server.js",
      "flutter analyze lib",
      "flutter test",
    ]);
  });
});
