import { describe, expect, it } from "vitest";

import { trackHireSearchWhitespaceFixture } from "./trackhire-search-whitespace-fixture.js";

describe("trackHireSearchWhitespaceFixture", () => {
  it("installs the fixture at the expected protected path", () => {
    expect(
      trackHireSearchWhitespaceFixture.path,
    ).toBe(
      "test/factory_benchmark_search_whitespace_test.dart",
    );
  });

  it("covers leading and trailing search whitespace", () => {
    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "group('trim-search-whitespace'",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "'   flutter   '",
    );
  });

  it("covers case-insensitive search", () => {
    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "group('case-insensitive-search'",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "'fLuTtEr'",
    );
  });

  it("covers all existing searchable fields", () => {
    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "group('searchable-fields'",
    );

    for (const value of [
      "factorybench",
      "mobile",
      "virginia",
      "120k",
      "reliability",
    ]) {
      expect(
        trackHireSearchWhitespaceFixture.content,
      ).toContain(`'${value}'`);
    }
  });

  it("covers composition with status and materials filters", () => {
    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "group('combined-filters'",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "setStatusFilter",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "setChecklistFilter",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "'Needs Resume'",
    );
  });

  it("covers existing search-clearing behavior", () => {
    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "group('clear-search'",
    );

    expect(
      trackHireSearchWhitespaceFixture.content,
    ).toContain(
      "clearSearchQuery",
    );
  });
});
