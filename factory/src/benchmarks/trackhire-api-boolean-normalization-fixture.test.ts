import { describe, expect, it } from "vitest";

import { trackHireApiBooleanNormalizationFixture } from "./trackhire-api-boolean-normalization-fixture.js";

describe("trackHireApiBooleanNormalizationFixture", () => {
  it("installs the fixture at the protected TrackHire test path", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.path,
    ).toBe(
      "test/factory_benchmark_api_boolean_normalization_test.dart",
    );
  });

  it("preserves the integer boolean contract that exposed the bug", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "group('integer-booleans'",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "'hasResume': 1",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "'hasPortfolio': 0",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "'isSaved': 0",
    );
  });

  it("preserves native boolean coverage", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "group('native-booleans'",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "'hasResume': true",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "'hasPortfolio': false",
    );
  });

  it("covers missing boolean defaults", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "group('missing-booleans'",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "expect(application.hasResume, isFalse)",
    );
  });

  it("covers non-boolean API fields and defaults", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "group('non-boolean-fields'",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "expect(application.company, 'Acme')",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "expect(application.status, 'Applied')",
    );
  });

  it("protects existing database deserialization behavior", () => {
    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "group('database-deserialization'",
    );

    expect(
      trackHireApiBooleanNormalizationFixture.content,
    ).toContain(
      "JobApplication.fromDatabaseJson",
    );
  });
});
