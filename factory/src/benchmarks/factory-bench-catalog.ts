import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

import { trackHireInterviewDateBenchmark } from "./trackhire-interview-date.js";

import { trackHireStatusSummaryBenchmark } from "./trackhire-status-summary.js";

import { trackHireApplicationSourceBenchmark } from "./trackhire-application-source.js";

import { trackHireCsvMaterialsReadyBenchmark } from "./trackhire-csv-materials-ready.js";

import { trackHireAiStaleStateBenchmark } from "./trackhire-ai-stale-state.js";

import { trackHireRequiredFieldWhitespaceBenchmark } from "./trackhire-required-field-whitespace.js";

import { trackHireSearchWhitespaceBenchmark } from "./trackhire-search-whitespace.js";

import { trackHireApiBooleanNormalizationBenchmark } from "./trackhire-api-boolean-normalization.js";

import { trackHireSaveErrorResponseBenchmark } from "./trackhire-save-error-response.js";

import { trackHireAmbiguousSortingBenchmark } from "./trackhire-ambiguous-sorting.js";

export const factoryBenchScenarios: readonly BenchmarkScenario[] = [
  trackHireInterviewDateBenchmark,
  trackHireStatusSummaryBenchmark,
  trackHireApplicationSourceBenchmark,
  trackHireCsvMaterialsReadyBenchmark,
  trackHireAiStaleStateBenchmark,
  trackHireRequiredFieldWhitespaceBenchmark,
  trackHireSearchWhitespaceBenchmark,
  trackHireApiBooleanNormalizationBenchmark,
  trackHireSaveErrorResponseBenchmark,
  trackHireAmbiguousSortingBenchmark,
];

export function getFactoryBenchScenario(
  scenarioId: string,
): BenchmarkScenario | undefined {
  return factoryBenchScenarios.find(
    (scenario) => scenario.id === scenarioId,
  );
}
