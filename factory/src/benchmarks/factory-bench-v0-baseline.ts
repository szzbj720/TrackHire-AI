import {
  FactoryBenchBaselineSnapshot,
  type FactoryBenchBaselineObservation,
} from "./factory-bench-baseline-snapshot.js";

export const factoryBenchV0Observations:
  FactoryBenchBaselineObservation[] = [
    {
      scenarioId:
        "trackhire-interview-date",
      kind: "factory-run",
      baselineRevision: null,
      passedCriteria: 0,
      failedCriteria: 5,
      totalCriteria: 5,
      overallPassed: false,
      validationPassed: false,
      source: "observed",
      inputTokens: 5436,
      outputTokens: 5187,
      durationMs: 338600,
    },
    {
      scenarioId:
        "trackhire-status-summary",
      kind: "factory-run",
      baselineRevision:
        "b2ac67dd0d1adcae89e38ae0ed4d3301323e8932",
      passedCriteria: 0,
      failedCriteria: 5,
      totalCriteria: 5,
      overallPassed: false,
      validationPassed: false,
      source: "observed",
      inputTokens: 3775,
      outputTokens: 3270,
      estimatedCostUsd: 0,
      durationMs: 189251,
      humanInterventions: 1,
    },
    {
      scenarioId:
        "trackhire-application-source",
      kind: "repository-control",
      baselineRevision:
        "9ef0967ed1b267756249dda40f4f5b99addb413d",
      passedCriteria: 1,
      failedCriteria: 5,
      totalCriteria: 6,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-csv-materials-ready",
      kind: "repository-control",
      baselineRevision:
        "964f4362b08afad4fd982e1c3c14d39e53142aa5",
      passedCriteria: 1,
      failedCriteria: 4,
      totalCriteria: 5,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-ai-stale-state",
      kind: "repository-control",
      baselineRevision:
        "ba4e5f4c51c377c6a61ce23929fc15ad671b9ef1",
      passedCriteria: 5,
      failedCriteria: 2,
      totalCriteria: 7,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-required-field-whitespace",
      kind: "repository-control",
      baselineRevision:
        "ba4e5f4c51c377c6a61ce23929fc15ad671b9ef1",
      passedCriteria: 4,
      failedCriteria: 2,
      totalCriteria: 6,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-search-whitespace",
      kind: "repository-control",
      baselineRevision:
        "d61036540a898bc3daabe4a4cbe2ea269623305f",
      passedCriteria: 4,
      failedCriteria: 2,
      totalCriteria: 6,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-api-boolean-normalization",
      kind: "repository-control",
      baselineRevision:
        "9ddba08f3e4eb73bd6d28c7f1a75361afeef559d",
      passedCriteria: 5,
      failedCriteria: 1,
      totalCriteria: 6,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-save-error-response",
      kind: "repository-control",
      baselineRevision:
        "14e4f032e400f459d754070e1769c07a53272a6b",
      passedCriteria: 3,
      failedCriteria: 1,
      totalCriteria: 4,
      overallPassed: false,
      validationPassed: null,
      source: "observed",
    },
    {
      scenarioId:
        "trackhire-ambiguous-sorting",
      kind: "factory-run",
      baselineRevision:
        "051a54b10cb2acd60376fe80a1f1668df6bd0172",
      passedCriteria: 0,
      failedCriteria: 4,
      totalCriteria: 4,
      overallPassed: false,
      validationPassed: true,
      source: "observed",
      inputTokens: 1973,
      outputTokens: 192,
      estimatedCostUsd: 0,
      durationMs: 36865,
      humanInterventions: 0,
    },
  ];

export const factoryBenchV0Baseline =
  new FactoryBenchBaselineSnapshot(
    factoryBenchV0Observations,
  );
