import { describe, expect, it } from "vitest";

import {
  factoryBenchScenarios,
  getFactoryBenchScenario,
} from "./factory-bench-catalog.js";

describe("FactoryBench catalog", () => {
  it("registers the current FactoryBench scenarios", () => {
    expect(
      factoryBenchScenarios.map((scenario) => scenario.id),
    ).toEqual([
      "trackhire-interview-date",
      "trackhire-status-summary",
      "trackhire-application-source",
      "trackhire-csv-materials-ready",
    ]);
  });

  it("keeps scenario ids unique", () => {
    const ids = factoryBenchScenarios.map(
      (scenario) => scenario.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("looks up a scenario by id", () => {
    const scenario = getFactoryBenchScenario(
      "trackhire-csv-materials-ready",
    );

    expect(scenario).toBeDefined();
    expect(scenario?.category).toBe("localized-change");
    expect(scenario?.difficulty).toBe("easy");
    expect(scenario?.expectedBehavior).toBe("implement");
    expect(scenario?.expectedComplexity).toBe("low");
    expect(scenario?.expectedRisk).toBe("low");
  });

  it("preserves the persistence benchmark metadata", () => {
    const scenario = getFactoryBenchScenario(
      "trackhire-application-source",
    );

    expect(scenario).toBeDefined();
    expect(scenario?.category).toBe("persistence");
    expect(scenario?.difficulty).toBe("hard");
  });

  it("returns undefined for an unknown scenario", () => {
    expect(
      getFactoryBenchScenario("does-not-exist"),
    ).toBeUndefined();
  });
});