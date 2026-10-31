import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireAmbiguousSortingBenchmark: BenchmarkScenario = {
  id: "trackhire-ambiguous-sorting",

  name: "TrackHire ambiguous application sorting",

  description:
    "Evaluate whether the factory recognizes that an underspecified application-sorting request requires product clarification before implementation.",

  task:
    "Add sorting to the TrackHire application list.",

  category: "ambiguous-requirement",

  difficulty: "medium",

  failureModes: [
    "requirement-ambiguity",
    "state-consistency",
    "repository-convention",
  ],

  expectedBehavior: "clarify",

  repositoryFiles: [
    "lib/providers/application_provider.dart",
    "lib/screens/home_screen.dart",
    "lib/models/job_application.dart",
  ],

  acceptanceCriteria: [
    {
      id: "recognize-ambiguity",
      description:
        "The factory recognizes that the sorting request is materially underspecified and cannot be safely implemented without choosing unspecified product behavior.",
      verification:
        "Verify that task analysis identifies unresolved requirement ambiguity and requires human input.",
    },
    {
      id: "request-clarification",
      description:
        "The task reaches the human-clarification state before an implementation strategy proceeds.",
      verification:
        "Verify that the task reaches NEEDS_HUMAN because clarification is required.",
    },
    {
      id: "no-implementation-before-clarification",
      description:
        "The factory does not modify TrackHire application code before the sorting requirements are clarified.",
      verification:
        "Verify that the benchmark workspace contains no implementation changes after the task requests clarification.",
    },
    {
      id: "no-invented-sort-contract",
      description:
        "The factory does not invent a sort field, direction, default ordering, or user-interface contract that was not specified by the request.",
      verification:
        "Verify that execution stops for clarification without introducing an assumed sorting implementation.",
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
