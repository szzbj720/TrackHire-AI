import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import {
    trackHireStatusSummaryBenchmark,
  } from "./trackhire-status-summary.js";
  
  export const factoryBenchScenarios:
    readonly BenchmarkScenario[] = [
      trackHireInterviewDateBenchmark,
      trackHireStatusSummaryBenchmark,
    ];
  
  export function getFactoryBenchScenario(
    scenarioId: string,
  ): BenchmarkScenario | undefined {
    return factoryBenchScenarios.find(
      (scenario) =>
        scenario.id === scenarioId,
    );
  }