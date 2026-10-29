import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";
import { trackHireInterviewDateBenchmark } from "./trackhire-interview-date.js";
import { trackHireStatusSummaryBenchmark } from "./trackhire-status-summary.js";
import { trackHireApplicationSourceBenchmark } from "./trackhire-application-source.js";
import { trackHireCsvMaterialsReadyBenchmark } from "./trackhire-csv-materials-ready.js";

export const factoryBenchScenarios: readonly BenchmarkScenario[] = [
  trackHireInterviewDateBenchmark,
  trackHireStatusSummaryBenchmark,
  trackHireApplicationSourceBenchmark,
  trackHireCsvMaterialsReadyBenchmark,
];

export function getFactoryBenchScenario(
  scenarioId: string,
): BenchmarkScenario | undefined {
  return factoryBenchScenarios.find(
    (scenario) => scenario.id === scenarioId,
  );
}