import {
    benchmarkScenarioSchema,
    type BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  const scenario = {
    id: "trackhire-application-source",
  
    name:
      "TrackHire application source persistence",
  
    description:
      "Add optional application-source support across the TrackHire Flutter model, API contract, and SQLite backend while preserving compatibility with existing applications.",
  
    task:
      "Add an optional source field to a TrackHire application so users can record where they found a job, such as LinkedIn, referral, company website, or career fair. The source must survive create, update, API serialization, and SQLite persistence, while existing applications without a source continue to work.",
  
    category: "persistence",
  
    difficulty: "hard",
  
    failureModes: [
      "persistence-loss",
      "api-mismatch",
      "cross-file-inconsistency",
      "type-contract",
      "regression",
      "edge-case",
    ],
  
    expectedBehavior: "implement",
  
    repositoryFiles: [
      "lib/models/job_application.dart",
      "lib/services/api_service.dart",
      "backend/server.js",
      "test/job_application_test.dart",
    ],
  
    acceptanceCriteria: [
      {
        id: "optional-source",
  
        description:
          "Existing applications remain valid without an application source.",
  
        verification:
          "Held-out tests confirm the source is optional and existing application construction remains compatible.",
      },
  
      {
        id: "serialize-source",
  
        description:
          "Application source is preserved by the Flutter data contract.",
  
        verification:
          "Held-out tests confirm API serialization and deserialization preserve the source value.",
      },
  
      {
        id: "create-source",
  
        description:
          "Application source is persisted when an application is created.",
  
        verification:
          "Backend acceptance tests confirm create requests store and return the source value.",
      },
  
      {
        id: "update-source",
  
        description:
          "Application source can be changed after creation.",
  
        verification:
          "Backend acceptance tests confirm update requests persist and return the changed source value.",
      },
  
      {
        id: "reload-source",
  
        description:
          "Application source survives SQLite persistence and subsequent reads.",
  
        verification:
          "Backend acceptance tests confirm a stored source is returned when the application is fetched again.",
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
  
  export const trackHireApplicationSourceBenchmark =
    benchmarkScenarioSchema.parse(
      scenario,
    );