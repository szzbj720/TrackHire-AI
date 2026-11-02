import type { BenchmarkScenario } from "../schemas/benchmark-scenario.js";

export const trackHireRequiredFieldWhitespaceBenchmark: BenchmarkScenario = {
  id: "trackhire-required-field-whitespace",
  name: "TrackHire required-field whitespace validation",
  description:
    "Prevent whitespace-only company or role values from being accepted when adding or editing a job application.",
  task:
    "Update TrackHire application validation so company and role values containing only whitespace are treated as empty and rejected. Preserve the existing validation message, allow valid company and role values to save normally, and preserve existing add/edit application behavior.",
  category: "localized-change",
  difficulty: "easy",
  failureModes: [
    "edge-case",
    "regression",
    "repository-convention",
  ],
  expectedBehavior: "implement",
  repositoryFiles: [
    "lib/screens/add_edit_job_screen.dart",
    "lib/models/job_application.dart",
  ],
  acceptanceCriteria: [
    {
      id: "reject-whitespace-company",
      description:
        "A whitespace-only company value is rejected.",
      verification:
        "Held-out widget tests enter only whitespace for company and verify the application is not accepted.",
    },
    {
      id: "reject-whitespace-role",
      description:
        "A whitespace-only role value is rejected.",
      verification:
        "Held-out widget tests enter only whitespace for role and verify the application is not accepted.",
    },
    {
      id: "validation-message",
      description:
        "Invalid required fields continue to show the existing validation message.",
      verification:
        "Held-out tests verify the existing company-and-role validation message is displayed.",
    },
    {
      id: "valid-input",
      description:
        "Valid company and role values continue to be accepted.",
      verification:
        "Held-out widget tests verify a normal application can still be saved.",
    },
    {
      id: "edit-behavior",
      description:
        "Existing application values continue to populate correctly when editing.",
      verification:
        "Held-out widget tests open an existing application and verify its required fields remain populated.",
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
  expectedComplexity: "low",
  expectedRisk: "low",
  requiresRealRepository: true,
};
