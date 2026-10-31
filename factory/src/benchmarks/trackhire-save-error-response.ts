import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireSaveErrorResponseBenchmark: BenchmarkScenario = {
  id: "trackhire-save-error-response",
  name: "TrackHire saved-status error response",
  description:
    "Make the TrackHire saved-status backend route return its intended server-error response when the updated application cannot be fetched after the save-state update.",
  task:
    "Fix the TrackHire PATCH /applications/:id/save error path so that if fetching the updated application fails after the saved-status update, the route returns the intended HTTP 500 JSON error response instead of failing inside its own error handler. Preserve successful saved-status toggling, preserve the existing not-found response, and preserve the existing API route behavior outside this failure path.",
  category: "regression",
  difficulty: "medium",
  failureModes: [
    "regression",
    "edge-case",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "backend/server.js",
    "lib/services/api_service.dart",
  ],
  acceptanceCriteria: [
    {
      id: "save-fetch-error-response",
      description:
        "The saved-status route's post-update fetch failure path returns the intended HTTP 500 JSON error response through the Express response object.",
      verification:
        "Run the held-out backend saved-status error-response fixture.",
    },
    {
      id: "save-success-contract",
      description:
        "The saved-status route continues to return the updated application after a successful saved-status update and fetch.",
      verification:
        "Run the held-out backend saved-status route contract fixture.",
    },
    {
      id: "save-not-found-contract",
      description:
        "The saved-status route preserves its existing 404 response when the requested application does not exist.",
      verification:
        "Run the held-out backend saved-status route contract fixture.",
    },
    {
      id: "regression",
      description:
        "The backend remains syntactically valid and existing TrackHire Flutter analysis and model tests continue to pass.",
      verification:
        "Run Node syntax validation, Flutter analysis, and the existing JobApplication model tests.",
    },
  ],
  validationCommands: [
    "node --check backend/server.js",
    "flutter analyze lib",
    "flutter test",
  ],
  expectedComplexity: "low",
  expectedRisk: "medium",
  requiresRealRepository: true,
};
