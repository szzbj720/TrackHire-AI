import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    factoryBenchScenarios,
    getFactoryBenchScenario,
  } from "./factory-bench-catalog.js";
  
  describe(
    "FactoryBench catalog",
    () => {
      it("registers the initial real TrackHire scenarios", () => {
        expect(
          factoryBenchScenarios.map(
            (scenario) => scenario.id,
          ),
        ).toEqual([
          "trackhire-interview-date",
          "trackhire-status-summary",
          "trackhire-application-source",
        ]);
      });
  
      it("does not contain duplicate scenario IDs", () => {
        const ids =
          factoryBenchScenarios.map(
            (scenario) => scenario.id,
          );
  
        expect(
          new Set(ids).size,
        ).toBe(ids.length);
      });
  
      it("covers multiple engineering categories", () => {
        const categories =
          new Set(
            factoryBenchScenarios.map(
              (scenario) =>
                scenario.category,
            ),
          );
  
        expect(
          categories.size,
        ).toBeGreaterThan(1);
  
        expect(
          categories,
        ).toContain(
          "persistence",
        );
      });
  
      it("covers multiple benchmark difficulties", () => {
        const difficulties =
          new Set(
            factoryBenchScenarios.map(
              (scenario) =>
                scenario.difficulty,
            ),
          );
  
        expect(
          difficulties.size,
        ).toBeGreaterThan(1);
      });
  
      it("tracks targeted engineering failure modes", () => {
        const failureModes =
          new Set(
            factoryBenchScenarios.flatMap(
              (scenario) =>
                scenario.failureModes,
            ),
          );
  
        expect(
          failureModes,
        ).toContain(
          "cross-file-inconsistency",
        );
  
        expect(
          failureModes,
        ).toContain(
          "regression",
        );
  
        expect(
          failureModes,
        ).toContain(
          "state-consistency",
        );
  
        expect(
          failureModes,
        ).toContain(
          "persistence-loss",
        );
  
        expect(
          failureModes,
        ).toContain(
          "api-mismatch",
        );
      });
  
      it("retrieves a scenario by ID", () => {
        const scenario =
          getFactoryBenchScenario(
            "trackhire-interview-date",
          );
  
        expect(
          scenario?.difficulty,
        ).toBe("hard");
  
        expect(
          scenario?.category,
        ).toBe("cross-layer");
      });
  
      it("retrieves the application-source scenario", () => {
        const scenario =
          getFactoryBenchScenario(
            "trackhire-application-source",
          );
  
        expect(
          scenario?.category,
        ).toBe("persistence");
  
        expect(
          scenario?.difficulty,
        ).toBe("hard");
  
        expect(
          scenario?.failureModes,
        ).toContain(
          "persistence-loss",
        );
      });
  
      it("returns undefined for an unknown scenario", () => {
        expect(
          getFactoryBenchScenario(
            "does-not-exist",
          ),
        ).toBeUndefined();
      });
    },
  );