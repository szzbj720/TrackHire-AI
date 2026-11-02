import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireCsvMaterialsReadyBenchmark: BenchmarkScenario = {
  id: "trackhire-csv-materials-ready",
  name: "TrackHire CSV materials-ready export",
  description:
    "Add application-material progress to TrackHire CSV exports while preserving the existing export structure.",
  task:
    "Add a `Materials Ready` column to the TrackHire CSV export. Each exported application should show the number of completed application materials as `X/5`, for example `3/5`. Keep all existing CSV columns and values unchanged.",
  category: "localized-change",
  difficulty: "easy",
  failureModes: [
    "edge-case",
    "regression",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "lib/services/csv_export_service.dart",
    "lib/models/job_application.dart",
  ],
  acceptanceCriteria: [
    {
      id: "materials-header",
      description: "The CSV contains a Materials Ready column.",
      verification:
        "Held-out CSV export tests confirm the Materials Ready header is present.",
    },
    {
      id: "materials-value",
      description:
        "Each exported application reports completed materials in X/5 format.",
      verification:
        "Held-out tests confirm applications with partial material completion export the expected X/5 value.",
    },
    {
      id: "materials-edge-cases",
      description:
        "Applications with zero or all materials completed export 0/5 and 5/5 respectively.",
      verification:
        "Held-out tests verify both zero-completion and full-completion cases.",
    },
    {
      id: "preserve-columns",
      description:
        "All existing CSV columns and application values remain present and unchanged.",
      verification:
        "Held-out tests verify the pre-existing export headers and representative application values.",
    },
    {
      id: "regression",
      description: "The existing TrackHire Flutter code remains valid.",
      verification:
        "Flutter analysis and the existing JobApplication tests continue to pass.",
    },
  ],
  validationCommands: [
    "flutter analyze",
    "flutter test",
  ],
  expectedComplexity: "low",
  expectedRisk: "low",
  requiresRealRepository: true,
};