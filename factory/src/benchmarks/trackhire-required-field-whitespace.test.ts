import { describe, expect, it } from "vitest";

import { trackHireRequiredFieldWhitespaceBenchmark } from "./trackhire-required-field-whitespace.js";

describe("trackHireRequiredFieldWhitespaceBenchmark", () => {
  it("defines the expected benchmark identity and metadata", () => {
    expect(
      trackHireRequiredFieldWhitespaceBenchmark.id,
    ).toBe("trackhire-required-field-whitespace");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.category,
    ).toBe("localized-change");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.difficulty,
    ).toBe("easy");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.expectedBehavior,
    ).toBe("implement");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.expectedComplexity,
    ).toBe("low");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.expectedRisk,
    ).toBe("low");

    expect(
      trackHireRequiredFieldWhitespaceBenchmark.requiresRealRepository,
    ).toBe(true);
  });

  it("targets the expected failure modes", () => {
    expect(
      trackHireRequiredFieldWhitespaceBenchmark.failureModes,
    ).toEqual([
      "edge-case",
      "regression",
      "repository-convention",
    ]);
  });

  it("scopes the task to application editing behavior", () => {
    expect(
      trackHireRequiredFieldWhitespaceBenchmark.repositoryFiles,
    ).toEqual([
      "lib/screens/add_edit_job_screen.dart",
      "lib/models/job_application.dart",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireRequiredFieldWhitespaceBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "reject-whitespace-company",
      "reject-whitespace-role",
      "validation-message",
      "valid-input",
      "edit-behavior",
      "regression",
    ]);
  });

  it("uses the standard Flutter validation commands", () => {
    expect(
      trackHireRequiredFieldWhitespaceBenchmark.validationCommands,
    ).toEqual([
      "flutter analyze",
      "flutter test",
    ]);
  });
});
