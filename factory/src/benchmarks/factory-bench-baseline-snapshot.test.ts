import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FactoryBenchBaselineSnapshot,
  type FactoryBenchBaselineObservation,
} from "./factory-bench-baseline-snapshot.js";

function makeObservation(
  overrides: Partial<FactoryBenchBaselineObservation> = {},
): FactoryBenchBaselineObservation {
  return {
    scenarioId: "scenario-1",
    kind: "repository-control",
    baselineRevision: "abc123",
    passedCriteria: 3,
    failedCriteria: 2,
    totalCriteria: 5,
    overallPassed: false,
    validationPassed: true,
    source: "observed",
    ...overrides,
  };
}

describe(
  "FactoryBenchBaselineSnapshot",
  () => {
    it(
      "summarizes observed baseline outcomes",
      () => {
        const snapshot =
          new FactoryBenchBaselineSnapshot([
            makeObservation({
              scenarioId: "scenario-1",
              passedCriteria: 3,
              failedCriteria: 2,
              totalCriteria: 5,
            }),
            makeObservation({
              scenarioId: "scenario-2",
              passedCriteria: 4,
              failedCriteria: 1,
              totalCriteria: 5,
            }),
          ]);

        const summary =
          snapshot.summarize();

        expect(
          summary.scenarioCount,
        ).toBe(2);

        expect(
          summary.passedScenarios,
        ).toBe(0);

        expect(
          summary.scenarioPassRate,
        ).toBe(0);

        expect(
          summary.passedCriteria,
        ).toBe(7);

        expect(
          summary.failedCriteria,
        ).toBe(3);

        expect(
          summary.totalCriteria,
        ).toBe(10);

        expect(
          summary.criterionPassRate,
        ).toBe(0.7);
      },
    );

    it(
      "separates factory runs from repository controls",
      () => {
        const snapshot =
          new FactoryBenchBaselineSnapshot([
            makeObservation({
              scenarioId: "scenario-1",
              kind: "factory-run",
            }),
            makeObservation({
              scenarioId: "scenario-2",
              kind: "repository-control",
            }),
            makeObservation({
              scenarioId: "scenario-3",
              kind: "repository-control",
            }),
          ]);

        const summary =
          snapshot.summarize();

        expect(
          summary.factoryRunScenarios,
        ).toBe(1);

        expect(
          summary.repositoryControlScenarios,
        ).toBe(2);
      },
    );

    it(
      "tracks validation coverage when validation was recorded",
      () => {
        const snapshot =
          new FactoryBenchBaselineSnapshot([
            makeObservation({
              scenarioId: "scenario-1",
              validationPassed: true,
            }),
            makeObservation({
              scenarioId: "scenario-2",
              validationPassed: false,
            }),
            makeObservation({
              scenarioId: "scenario-3",
              validationPassed: null,
            }),
          ]);

        const summary =
          snapshot.summarize();

        expect(
          summary.validationMeasuredScenarios,
        ).toBe(2);

        expect(
          summary.validationPassedScenarios,
        ).toBe(1);

        expect(
          summary.validationPassRate,
        ).toBe(0.5);
      },
    );

    it(
      "preserves optional model measurements without inventing missing values",
      () => {
        const snapshot =
          new FactoryBenchBaselineSnapshot([
            makeObservation({
              scenarioId: "scenario-1",
              kind: "factory-run",
              inputTokens: 1973,
              outputTokens: 192,
              durationMs: 36865,
              humanInterventions: 0,
            }),
            makeObservation({
              scenarioId: "scenario-2",
            }),
          ]);

        expect(
          snapshot.observations[0]
            ?.inputTokens,
        ).toBe(1973);

        expect(
          snapshot.observations[1]
            ?.inputTokens,
        ).toBeUndefined();

        expect(
          snapshot.observations[1]
            ?.durationMs,
        ).toBeUndefined();
      },
    );

    it(
      "allows an unknown historical revision",
      () => {
        const snapshot =
          new FactoryBenchBaselineSnapshot([
            makeObservation({
              baselineRevision: null,
            }),
          ]);

        expect(
          snapshot.observations[0]
            ?.baselineRevision,
        ).toBeNull();
      },
    );

    it(
      "rejects duplicate scenario observations",
      () => {
        expect(
          () =>
            new FactoryBenchBaselineSnapshot([
              makeObservation({
                scenarioId: "scenario-1",
              }),
              makeObservation({
                scenarioId: "scenario-1",
              }),
            ]),
        ).toThrow(
          "FactoryBench baseline snapshot requires one observation per scenario.",
        );
      },
    );

    it(
      "rejects inconsistent criterion totals",
      () => {
        expect(
          () =>
            new FactoryBenchBaselineSnapshot([
              makeObservation({
                passedCriteria: 3,
                failedCriteria: 1,
                totalCriteria: 5,
              }),
            ]),
        ).toThrow(
          "FactoryBench baseline observation has inconsistent criterion totals: scenario-1.",
        );
      },
    );

    it(
      "rejects an empty snapshot",
      () => {
        expect(
          () =>
            new FactoryBenchBaselineSnapshot(
              [],
            ),
        ).toThrow(
          "FactoryBench baseline snapshot cannot be empty.",
        );
      },
    );
  },
);
