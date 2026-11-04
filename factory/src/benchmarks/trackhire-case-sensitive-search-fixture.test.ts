import { describe, expect, it } from "vitest";
import { trackHireCaseSensitiveSearchFixture as fixture } from "./trackhire-case-sensitive-search-fixture.js";

describe("held-out case-sensitive search Flutter fixture", () => {
  it("has a Flutter test path outside normal app tests", () => {
    expect(fixture.path).toBe("test/factory_case_sensitive_search_test.dart");
  });

  it("covers default, enabled, disabled and combined-filter behavior", () => {
    expect(fixture.content).toContain("default mode ignores letter casing");
    expect(fixture.content).toContain("enabled mode matches exact casing");
    expect(fixture.content).toContain("turning case sensitivity off");
    expect(fixture.content).toContain("composes with status and checklist filters");
    expect(fixture.content).toContain("provider.toggleCaseSensitiveSearch()");
    expect(fixture.content).toContain("provider.filteredApplications");
  });
});
