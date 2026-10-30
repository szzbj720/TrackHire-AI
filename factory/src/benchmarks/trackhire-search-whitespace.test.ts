import { describe, expect, it } from "vitest";

import { trackHireSearchWhitespaceBenchmark } from "./trackhire-search-whitespace.js";

describe("trackHireSearchWhitespaceBenchmark", () => {
  it("defines the expected benchmark identity and metadata", () => {
    expect(
      trackHireSearchWhitespaceBenchmark.id,
    ).toBe("trackhire-search-whitespace");

    expect(
      trackHireSearchWhitespaceBenchmark.category,
    ).toBe("state-management");

    expect(
      trackHireSearchWhitespaceBenchmark.difficulty,
    ).toBe("easy");

    expect(
      trackHireSearchWhitespaceBenchmark.expectedBehavior,
    ).toBe("implement");

    expect(
      trackHireSearchWhitespaceBenchmark.expectedComplexity,
    ).toBe("low");

    expect(
      trackHireSearchWhitespaceBenchmark.expectedRisk,
    ).toBe("low");

    expect(
      trackHireSearchWhitespaceBenchmark.requiresRealRepository,
    ).toBe(true);
  });

  it("targets the expected failure modes", () => {
    expect(
      trackHireSearchWhitespaceBenchmark.failureModes,
    ).toEqual([
      "edge-case",
      "state-consistency",
      "regression",
      "repository-convention",
    ]);
  });

  it("scopes the task to application search behavior", () => {
    expect(
      trackHireSearchWhitespaceBenchmark.repositoryFiles,
    ).toEqual([
      "lib/providers/application_provider.dart",
      "lib/models/job_application.dart",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireSearchWhitespaceBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "trim-search-whitespace",
      "case-insensitive-search",
      "searchable-fields",
      "combined-filters",
      "clear-search",
      "regression",
    ]);
  });

  it("uses the standard Flutter validation commands", () => {
    expect(
      trackHireSearchWhitespaceBenchmark.validationCommands,
    ).toEqual([
      "flutter analyze",
      "flutter test",
    ]);
  });
});
