import { describe, expect, it } from "vitest";

import {
  factoryBenchScenarios,
  getFactoryBenchScenario,
} from "./factory-bench-catalog.js";

describe("FactoryBench catalog", () => {
  it("registers the current FactoryBench scenarios", () => {
    expect(
      factoryBenchScenarios.map(
        (scenario) => scenario.id,
      ),
    ).toEqual([
      "trackhire-interview-date",
      "trackhire-status-summary",
      "trackhire-application-source",
      "trackhire-csv-materials-ready",
      "trackhire-ai-stale-state",
      "trackhire-required-field-whitespace",
      "trackhire-search-whitespace",
      "trackhire-api-boolean-normalization",
      "trackhire-save-error-response",
      "trackhire-ambiguous-sorting",
    ]);
  });

  it("keeps scenario ids unique", () => {
    const ids =
      factoryBenchScenarios.map(
        (scenario) => scenario.id,
      );

    expect(
      new Set(ids).size,
    ).toBe(ids.length);
  });

  it("looks up the ambiguous sorting benchmark by id", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-ambiguous-sorting",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe(
      "ambiguous-requirement",
    );

    expect(
      scenario?.difficulty,
    ).toBe("medium");

    expect(
      scenario?.expectedBehavior,
    ).toBe("clarify");

    expect(
      scenario?.expectedComplexity,
    ).toBe("medium");

    expect(
      scenario?.expectedRisk,
    ).toBe("medium");

    expect(
      scenario?.failureModes,
    ).toContain(
      "requirement-ambiguity",
    );
  });

  it("looks up the saved-status error-response benchmark by id", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-save-error-response",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("regression");

    expect(
      scenario?.difficulty,
    ).toBe("medium");

    expect(
      scenario?.expectedBehavior,
    ).toBe("implement");

    expect(
      scenario?.expectedComplexity,
    ).toBe("low");

    expect(
      scenario?.expectedRisk,
    ).toBe("medium");
  });

  it("looks up the API boolean normalization benchmark by id", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-api-boolean-normalization",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("cross-layer");

    expect(
      scenario?.difficulty,
    ).toBe("medium");

    expect(
      scenario?.expectedBehavior,
    ).toBe("implement");

    expect(
      scenario?.expectedComplexity,
    ).toBe("medium");

    expect(
      scenario?.expectedRisk,
    ).toBe("medium");
  });

  it("preserves the search whitespace benchmark metadata", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-search-whitespace",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("state-management");

    expect(
      scenario?.difficulty,
    ).toBe("easy");
  });

  it("preserves the required-field whitespace benchmark metadata", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-required-field-whitespace",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("localized-change");

    expect(
      scenario?.difficulty,
    ).toBe("easy");
  });

  it("preserves the AI stale-state benchmark metadata", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-ai-stale-state",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("state-management");

    expect(
      scenario?.difficulty,
    ).toBe("medium");
  });

  it("preserves the localized CSV benchmark metadata", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-csv-materials-ready",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("localized-change");

    expect(
      scenario?.difficulty,
    ).toBe("easy");
  });

  it("preserves the persistence benchmark metadata", () => {
    const scenario =
      getFactoryBenchScenario(
        "trackhire-application-source",
      );

    expect(scenario).toBeDefined();

    expect(
      scenario?.category,
    ).toBe("persistence");

    expect(
      scenario?.difficulty,
    ).toBe("hard");
  });

  it("returns undefined for an unknown scenario", () => {
    expect(
      getFactoryBenchScenario(
        "does-not-exist",
      ),
    ).toBeUndefined();
  });
});
