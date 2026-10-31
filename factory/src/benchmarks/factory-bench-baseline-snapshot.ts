export type FactoryBenchBaselineObservationKind =
  | "factory-run"
  | "repository-control";

export interface FactoryBenchBaselineObservation {
  scenarioId: string;
  kind: FactoryBenchBaselineObservationKind;
  baselineRevision: string | null;
  passedCriteria: number;
  failedCriteria: number;
  totalCriteria: number;
  overallPassed: boolean;
  validationPassed: boolean | null;
  source: "observed";
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  durationMs?: number;
  humanInterventions?: number;
}

export interface FactoryBenchBaselineSnapshotSummary {
  scenarioCount: number;
  factoryRunScenarios: number;
  repositoryControlScenarios: number;
  passedScenarios: number;
  scenarioPassRate: number;
  passedCriteria: number;
  failedCriteria: number;
  totalCriteria: number;
  criterionPassRate: number;
  validationMeasuredScenarios: number;
  validationPassedScenarios: number;
  validationPassRate: number;
}

function rate(
  passed: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return passed / total;
}

export class FactoryBenchBaselineSnapshot {
  readonly observations:
    readonly FactoryBenchBaselineObservation[];

  constructor(
    observations:
      FactoryBenchBaselineObservation[],
  ) {
    if (observations.length === 0) {
      throw new Error(
        "FactoryBench baseline snapshot cannot be empty.",
      );
    }

    const scenarioIds =
      observations.map(
        (observation) =>
          observation.scenarioId,
      );

    if (
      new Set(scenarioIds).size !==
      scenarioIds.length
    ) {
      throw new Error(
        "FactoryBench baseline snapshot requires one observation per scenario.",
      );
    }

    for (
      const observation
      of observations
    ) {
      if (
        observation.passedCriteria +
          observation.failedCriteria !==
        observation.totalCriteria
      ) {
        throw new Error(
          `FactoryBench baseline observation has inconsistent criterion totals: ${observation.scenarioId}.`,
        );
      }
    }

    this.observations =
      observations.map(
        (observation) => ({
          ...observation,
        }),
      );
  }

  summarize():
    FactoryBenchBaselineSnapshotSummary {
    const factoryRunScenarios =
      this.observations.filter(
        (observation) =>
          observation.kind ===
          "factory-run",
      ).length;

    const repositoryControlScenarios =
      this.observations.filter(
        (observation) =>
          observation.kind ===
          "repository-control",
      ).length;

    const passedScenarios =
      this.observations.filter(
        (observation) =>
          observation.overallPassed,
      ).length;

    const passedCriteria =
      this.observations.reduce(
        (sum, observation) =>
          sum +
          observation.passedCriteria,
        0,
      );

    const failedCriteria =
      this.observations.reduce(
        (sum, observation) =>
          sum +
          observation.failedCriteria,
        0,
      );

    const totalCriteria =
      this.observations.reduce(
        (sum, observation) =>
          sum +
          observation.totalCriteria,
        0,
      );

    const validationObservations =
      this.observations.filter(
        (observation) =>
          observation.validationPassed !==
          null,
      );

    const validationPassedScenarios =
      validationObservations.filter(
        (observation) =>
          observation.validationPassed ===
          true,
      ).length;

    return {
      scenarioCount:
        this.observations.length,
      factoryRunScenarios,
      repositoryControlScenarios,
      passedScenarios,
      scenarioPassRate:
        rate(
          passedScenarios,
          this.observations.length,
        ),
      passedCriteria,
      failedCriteria,
      totalCriteria,
      criterionPassRate:
        rate(
          passedCriteria,
          totalCriteria,
        ),
      validationMeasuredScenarios:
        validationObservations.length,
      validationPassedScenarios,
      validationPassRate:
        rate(
          validationPassedScenarios,
          validationObservations.length,
        ),
    };
  }
}
