import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireSearchWhitespaceBenchmark: BenchmarkScenario = {
  id: "trackhire-search-whitespace",
  name: "TrackHire search whitespace normalization",
  description:
    "Normalize leading and trailing whitespace in application search queries without changing normal search and filter behavior.",
  task:
    "Update TrackHire application search so leading and trailing whitespace in the user's search query does not prevent otherwise matching applications from being found. Preserve case-insensitive search across the existing searchable fields, preserve status and materials filtering, and preserve existing search-clearing behavior.",
  category: "state-management",
  difficulty: "easy",
  failureModes: [
    "edge-case",
    "state-consistency",
    "regression",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "lib/providers/application_provider.dart",
    "lib/models/job_application.dart",
  ],
  acceptanceCriteria: [
    {
      id: "trim-search-whitespace",
      description:
        "Leading and trailing whitespace in a search query does not prevent a matching application from being found.",
      verification:
        "Held-out provider tests search with surrounding whitespace and verify the expected application remains visible.",
    },
    {
      id: "case-insensitive-search",
      description:
        "Search remains case-insensitive.",
      verification:
        "Held-out tests use mixed-case search text and verify matching applications are returned.",
    },
    {
      id: "searchable-fields",
      description:
        "Search continues to match the existing searchable application fields.",
      verification:
        "Held-out tests verify matches across company, role, location, salary range, and notes.",
    },
    {
      id: "combined-filters",
      description:
        "Normalized search continues to compose correctly with status and materials filters.",
      verification:
        "Held-out tests combine search, status, and checklist filtering and verify only applications satisfying all conditions remain.",
    },
    {
      id: "clear-search",
      description:
        "Clearing search continues to restore the unsearched application set.",
      verification:
        "Held-out tests set and clear a search query and verify applications are restored.",
    },
    {
      id: "regression",
      description:
        "The existing TrackHire Flutter code remains valid.",
      verification:
        "Flutter analysis and existing TrackHire tests continue to pass.",
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
