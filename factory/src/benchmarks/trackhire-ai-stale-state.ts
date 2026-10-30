import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireAiStaleStateBenchmark: BenchmarkScenario = {
  id: "trackhire-ai-stale-state",
  name: "TrackHire AI stale-state handling",
  description:
    "Prevent stale AI analysis and resume-tailoring results from remaining visible after invalid empty input.",
  task:
    "When a user submits an empty or whitespace-only job description after previously generating AI results, clear the stale result before showing the validation error. Empty analysis input must clear the previous analysis, and empty resume-tailoring input must clear the previous tailored resume bullets. Preserve the existing validation messages and successful AI analysis, resume tailoring, loading, error, and clearAnalysis behavior.",
  category: "state-management",
  difficulty: "medium",
  failureModes: [
    "state-consistency",
    "regression",
    "edge-case",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "lib/viewmodels/ai_view_model.dart",
    "lib/services/ai_service.dart",
    "lib/models/ai_job_analysis.dart",
  ],
  acceptanceCriteria: [
    {
      id: "clear-stale-analysis",
      description:
        "Empty or whitespace-only analysis input clears any previously generated analysis.",
      verification:
        "Held-out view-model tests generate an analysis, submit blank input, and verify the previous analysis is removed.",
    },
    {
      id: "analysis-validation",
      description:
        "Empty analysis input continues to report the existing validation message.",
      verification:
        "Held-out tests verify the analysis validation message remains unchanged after stale state is cleared.",
    },
    {
      id: "clear-stale-resume",
      description:
        "Empty or whitespace-only resume-tailoring input clears any previously generated resume bullets.",
      verification:
        "Held-out view-model tests generate resume bullets, submit blank input, and verify the previous bullets are removed.",
    },
    {
      id: "resume-validation",
      description:
        "Empty resume-tailoring input continues to report the existing validation message.",
      verification:
        "Held-out tests verify the resume-tailoring validation message remains unchanged after stale state is cleared.",
    },
    {
      id: "successful-results",
      description:
        "Valid analysis and resume-tailoring requests continue to produce results.",
      verification:
        "Held-out tests verify valid job descriptions still generate analysis and tailored resume bullets.",
    },
    {
      id: "clear-analysis",
      description:
        "The existing clearAnalysis behavior continues to clear AI results and errors.",
      verification:
        "Held-out tests populate AI state, call clearAnalysis, and verify the state is reset.",
    },
    {
      id: "regression",
      description:
        "The existing TrackHire Flutter code remains valid.",
      verification:
        "Flutter analysis and the existing TrackHire tests continue to pass.",
    },
  ],
  validationCommands: [
    "flutter analyze",
    "flutter test",
  ],
  expectedComplexity: "medium",
  expectedRisk: "medium",
  requiresRealRepository: true,
};