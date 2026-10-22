import {
    benchmarkScenarioSchema,
    type BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  const scenario = {
    id:
      "trackhire-status-summary",
  
    name:
      "TrackHire application status summary",
  
    description:
      "Add application status summary support to the real TrackHire application while preserving existing application behavior.",
  
    task:
      "Add a status summary that reports how many tracked job applications exist in each application status.",
  
    repositoryFiles: [
      "lib/models/job_application.dart",
      "lib/providers/application_provider.dart",
      "test/job_application_test.dart",
    ],
  
    acceptanceCriteria: [
      {
        id:
          "counts-statuses",
  
        description:
          "Applications are counted correctly by status.",
  
        verification:
          "Provider tests confirm applications are grouped and counted by their current status.",
      },
  
      {
        id:
          "zero-counts",
  
        description:
          "Statuses with no applications return a zero count.",
  
        verification:
          "Provider tests confirm supported statuses with no matching applications are represented with zero.",
      },
  
      {
        id:
          "updates-summary",
  
        description:
          "The status summary updates when the application collection changes.",
  
        verification:
          "Provider tests confirm adding, editing, or removing applications changes the derived summary.",
      },
  
      {
        id:
          "all-statuses",
  
        description:
          "The summary covers every application status supported by TrackHire.",
  
        verification:
          "Tests confirm every supported application status is represented in the summary.",
      },
  
      {
        id:
          "regression",
  
        description:
          "Existing TrackHire behavior remains valid.",
  
        verification:
          "Flutter analysis and the existing test suite pass.",
      },
    ],
  
    validationCommands: [
      "flutter analyze",
      "flutter test",
    ],
  
    expectedComplexity:
      "medium",
  
    expectedRisk:
      "low",
  
    requiresRealRepository:
      true,
  } satisfies BenchmarkScenario;
  
  export const trackHireStatusSummaryBenchmark =
    benchmarkScenarioSchema.parse(
      scenario,
    );