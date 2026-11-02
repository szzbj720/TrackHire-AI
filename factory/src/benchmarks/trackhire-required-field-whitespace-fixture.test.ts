import { describe, expect, it } from "vitest";

import { trackHireRequiredFieldWhitespaceFixture } from "./trackhire-required-field-whitespace-fixture.js";

describe("trackHireRequiredFieldWhitespaceFixture", () => {
  it("installs the fixture at the expected protected path", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.path,
    ).toBe(
      "test/factory_benchmark_required_field_whitespace_test.dart",
    );
  });

  it("covers whitespace-only company validation", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "group('reject-whitespace-company'",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "'   '",
    );
  });

  it("covers whitespace-only role validation", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "group('reject-whitespace-role'",
    );
  });

  it("preserves the existing validation message", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "group('validation-message'",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "Please enter a company and role.",
    );
  });

  it("covers successful application creation", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "group('valid-input'",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "result?.company",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "result?.role",
    );
  });

  it("covers existing edit behavior", () => {
    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "group('edit-behavior'",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "Existing Company",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "Existing Role",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "companyField.controller?.text",
    );

    expect(
      trackHireRequiredFieldWhitespaceFixture.content,
    ).toContain(
      "roleField.controller?.text",
    );
  });
});
