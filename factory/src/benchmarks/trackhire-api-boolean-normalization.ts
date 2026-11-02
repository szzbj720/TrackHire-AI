import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireApiBooleanNormalizationBenchmark: BenchmarkScenario = {
  id: "trackhire-api-boolean-normalization",
  name: "TrackHire API boolean normalization",
  description:
    "Make TrackHire API deserialization robust to boolean values represented as either JSON booleans or SQLite-style integer booleans without changing existing model behavior.",
  task:
    "Update TrackHire application API deserialization so boolean fields accept both JSON boolean values and SQLite-style integer values where 1 means true and 0 means false. Preserve existing true/false behavior, preserve default values when boolean fields are missing, preserve non-boolean application fields, and preserve existing database deserialization behavior.",
  category: "cross-layer",
  difficulty: "medium",
  failureModes: [
    "type-contract",
    "api-mismatch",
    "edge-case",
    "regression",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "lib/models/job_application.dart",
    "lib/services/api_service.dart",
  ],
  acceptanceCriteria: [
    {
      id: "integer-booleans",
      description:
        "API deserialization accepts integer boolean values where 1 maps to true and 0 maps to false.",
      verification:
        "Run the held-out integer-booleans fixture group.",
    },
    {
      id: "native-booleans",
      description:
        "API deserialization continues to accept native true and false boolean values.",
      verification:
        "Run the held-out native-booleans fixture group.",
    },
    {
      id: "missing-booleans",
      description:
        "Missing API boolean fields continue to default to false.",
      verification:
        "Run the held-out missing-booleans fixture group.",
    },
    {
      id: "non-boolean-fields",
      description:
        "API deserialization preserves existing application field values and defaults outside the boolean normalization change.",
      verification:
        "Run the held-out non-boolean-fields fixture group.",
    },
    {
      id: "database-deserialization",
      description:
        "Existing database deserialization continues to convert SQLite integer boolean values correctly.",
      verification:
        "Run the held-out database-deserialization fixture group.",
    },
    {
      id: "regression",
      description:
        "TrackHire analysis and existing model tests continue to pass.",
      verification:
        "Run Flutter analysis and the existing JobApplication model tests.",
    },
  ],
  validationCommands: [
    "flutter analyze lib",
    "flutter test",
  ],
  expectedComplexity: "medium",
  expectedRisk: "medium",
  requiresRealRepository: true,
};
