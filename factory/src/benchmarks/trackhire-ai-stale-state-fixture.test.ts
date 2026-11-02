import { describe, expect, it } from "vitest";

import { trackHireAiStaleStateFixture } from "./trackhire-ai-stale-state-fixture.js";

describe("trackHireAiStaleStateFixture", () => {
  it("installs the fixture at the expected protected path", () => {
    expect(
      trackHireAiStaleStateFixture.path,
    ).toBe(
      "test/factory_benchmark_ai_stale_state_test.dart",
    );
  });

  it("covers stale analysis clearing", () => {
    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "group('clear-stale-analysis'",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "expect(viewModel.analysis, isNull)",
    );
  });

  it("covers analysis validation behavior", () => {
    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "group('analysis-validation'",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "Please paste a job description first.",
    );
  });

  it("covers stale resume clearing", () => {
    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "group('clear-stale-resume'",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "viewModel.tailoredResumeBullets",
    );
  });

  it("covers successful requests", () => {
    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "group('successful-results'",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "expect(viewModel.analysis, isNotNull)",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "isTailoringResume",
    );
  });

  it("covers clearAnalysis regression behavior", () => {
    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "group('clear-analysis'",
    );

    expect(
      trackHireAiStaleStateFixture.content,
    ).toContain(
      "viewModel.clearAnalysis()",
    );
  });
});