import { describe, expect, it } from "vitest";

import { trackHireAiStaleStateBenchmark } from "./trackhire-ai-stale-state.js";

describe("trackHireAiStaleStateBenchmark", () => {
  it("defines the expected benchmark identity and metadata", () => {
    expect(
      trackHireAiStaleStateBenchmark.id,
    ).toBe("trackhire-ai-stale-state");

    expect(
      trackHireAiStaleStateBenchmark.category,
    ).toBe("state-management");

    expect(
      trackHireAiStaleStateBenchmark.difficulty,
    ).toBe("medium");

    expect(
      trackHireAiStaleStateBenchmark.expectedBehavior,
    ).toBe("implement");

    expect(
      trackHireAiStaleStateBenchmark.expectedComplexity,
    ).toBe("medium");

    expect(
      trackHireAiStaleStateBenchmark.expectedRisk,
    ).toBe("medium");

    expect(
      trackHireAiStaleStateBenchmark.requiresRealRepository,
    ).toBe(true);
  });

  it("targets stale-state and regression failure modes", () => {
    expect(
      trackHireAiStaleStateBenchmark.failureModes,
    ).toEqual([
      "state-consistency",
      "regression",
      "edge-case",
      "repository-convention",
    ]);
  });

  it("scopes the task to the existing AI flow", () => {
    expect(
      trackHireAiStaleStateBenchmark.repositoryFiles,
    ).toEqual([
      "lib/viewmodels/ai_view_model.dart",
      "lib/services/ai_service.dart",
      "lib/models/ai_job_analysis.dart",
    ]);
  });

  it("defines the expected acceptance criteria", () => {
    expect(
      trackHireAiStaleStateBenchmark.acceptanceCriteria.map(
        (criterion) => criterion.id,
      ),
    ).toEqual([
      "clear-stale-analysis",
      "analysis-validation",
      "clear-stale-resume",
      "resume-validation",
      "successful-results",
      "clear-analysis",
      "regression",
    ]);
  });

  it("uses the standard Flutter validation commands", () => {
    expect(
      trackHireAiStaleStateBenchmark.validationCommands,
    ).toEqual([
      "flutter analyze",
      "flutter test",
    ]);
  });
});