import {
  describe,
  expect,
  it,
} from "vitest";

import {
  factoryBenchV0Baseline,
  factoryBenchV0Observations,
} from "./factory-bench-v0-baseline.js";

describe(
  "FactoryBench V0 baseline",
  () => {
    it(
      "contains all ten FactoryBench scenarios",
      () => {
        expect(
          factoryBenchV0Observations.map(
            (observation) =>
              observation.scenarioId,
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
      },
    );

    it(
      "keeps factory runs separate from repository controls",
      () => {
        const summary =
          factoryBenchV0Baseline.summarize();

        expect(
          summary.scenarioCount,
        ).toBe(10);

        expect(
          summary.factoryRunScenarios,
        ).toBe(3);

        expect(
          summary.repositoryControlScenarios,
        ).toBe(7);
      },
    );

    it(
      "preserves the observed criterion totals",
      () => {
        const summary =
          factoryBenchV0Baseline.summarize();

        expect(
          summary.passedCriteria,
        ).toBe(23);

        expect(
          summary.failedCriteria,
        ).toBe(31);

        expect(
          summary.totalCriteria,
        ).toBe(54);

        expect(
          summary.criterionPassRate,
        ).toBeCloseTo(
          23 / 54,
        );
      },
    );

    it(
      "records no fully passing historical scenario",
      () => {
        const summary =
          factoryBenchV0Baseline.summarize();

        expect(
          summary.passedScenarios,
        ).toBe(0);

        expect(
          summary.scenarioPassRate,
        ).toBe(0);
      },
    );

    it(
      "preserves known factory-run validation outcomes",
      () => {
        const factoryRuns =
          factoryBenchV0Observations.filter(
            (observation) =>
              observation.kind ===
              "factory-run",
          );

        expect(
          factoryRuns.map(
            (observation) => ({
              scenarioId:
                observation.scenarioId,
              validationPassed:
                observation.validationPassed,
            }),
          ),
        ).toEqual([
          {
            scenarioId:
              "trackhire-interview-date",
            validationPassed: false,
          },
          {
            scenarioId:
              "trackhire-status-summary",
            validationPassed: false,
          },
          {
            scenarioId:
              "trackhire-ambiguous-sorting",
            validationPassed: true,
          },
        ]);
      },
    );

    it(
      "does not invent a revision for the interview-date run",
      () => {
        const observation =
          factoryBenchV0Observations.find(
            (candidate) =>
              candidate.scenarioId ===
              "trackhire-interview-date",
          );

        expect(
          observation?.baselineRevision,
        ).toBeNull();
      },
    );
  },
);
