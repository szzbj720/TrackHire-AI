import {
    benchmarkScenarioSchema,
    type BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  const scenario = {
    id: "trackhire-interview-date",
  
    name:
      "TrackHire interview date",
  
    description:
      "Add optional interview scheduling support to the real TrackHire application while preserving existing application behavior.",
  
    task:
      "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  
    repositoryFiles: [
      "lib/models/job_application.dart",
      "lib/providers/application_provider.dart",
      "lib/screens/add_edit_job_screen.dart",
      "test/job_application_test.dart",
    ],
  
    acceptanceCriteria: [
      {
        id: "optional-date",
  
        description:
          "A job application can exist without an interview date.",
  
        verification:
          "Model tests confirm existing applications remain valid when no interview date is present.",
      },
  
      {
        id: "persist-date",
  
        description:
          "An interview date survives application serialization and deserialization.",
  
        verification:
          "Model tests confirm database and API conversions preserve the interview date.",
      },
  
      {
        id: "edit-date",
  
        description:
          "Users can add or edit an interview date.",
  
        verification:
          "The add/edit application flow exposes optional interview date input.",
      },
  
      {
        id: "upcoming-interviews",
  
        description:
          "Upcoming interviews can be derived from tracked applications.",
  
        verification:
          "Provider tests confirm future interview dates are returned in chronological order and applications without upcoming interviews are excluded.",
      },
  
      {
        id: "regression",
  
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
  
    expectedComplexity: "high",
  
    expectedRisk: "medium",
  
    requiresRealRepository: true,
  } satisfies BenchmarkScenario;
  
  export const trackHireInterviewDateBenchmark =
    benchmarkScenarioSchema.parse(
      scenario,
    );