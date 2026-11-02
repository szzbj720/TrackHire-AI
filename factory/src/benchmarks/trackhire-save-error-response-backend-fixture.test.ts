import { describe, expect, it } from "vitest";

import {
  trackHireSaveErrorResponseBackendFixture,
} from "./trackhire-save-error-response-backend-fixture.js";

describe("trackHireSaveErrorResponseBackendFixture", () => {
  it("installs the held-out fixture in the TrackHire backend", () => {
    expect(
      trackHireSaveErrorResponseBackendFixture.path,
    ).toBe(
      "backend/factory_benchmark_save_error_response_test.js",
    );
  });

  it("checks the invalid response identifier failure", () => {
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain("\\bresq\\b");
  });

  it("checks the intended 500 error response", () => {
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain("status\\s*\\(\\s*500");
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain(
      "Failed to fetch updated application",
    );
  });

  it("checks the existing 404 and success contracts", () => {
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain("status\\s*\\(\\s*404");
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain("formatApplication");
    expect(
      trackHireSaveErrorResponseBackendFixture.content,
    ).toContain("updatedRow");
  });
});
