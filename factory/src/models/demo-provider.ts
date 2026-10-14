import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "./provider.js";
  
  export class DemoPlanningProvider
    implements ModelProvider
  {
    private callCount = 0;
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      this.callCount += 1;
  
      if (this.callCount === 1) {
        return {
          content: JSON.stringify({
            complexity: "medium",
            risk: "medium",
            affectedAreas: [
              "application model",
              "application state",
              "application UI",
              "tests",
            ],
            relevantFiles: [
              "lib/models/job_application.dart",
              "lib/providers/application_provider.dart",
              "lib/screens/add_edit_job_screen.dart",
              "test/job_application_test.dart",
            ],
            ambiguities: [],
            assumptions: [
              "Interview dates are optional.",
            ],
            confidence: 0.9,
            requiresHumanInput: false,
            reasoning:
              "The task affects application data and how upcoming interviews are presented.",
          }),
          model: "demo-analyzer",
        };
      }
  
      if (this.callCount === 2) {
        return {
          content: JSON.stringify({
            summary:
              "Add optional interview date support and expose upcoming interviews.",
            steps: [
              {
                order: 1,
                description:
                  "Extend the application model with an optional interview date.",
                files: [
                  "lib/models/job_application.dart",
                ],
                rationale:
                  "The application model needs to represent the new optional value.",
              },
              {
                order: 2,
                description:
                  "Update application state and UI flows to handle interview dates.",
                files: [
                  "lib/providers/application_provider.dart",
                  "lib/screens/add_edit_job_screen.dart",
                ],
                rationale:
                  "Users need to enter and consume the interview date.",
              },
              {
                order: 3,
                description:
                  "Add tests covering applications with and without interview dates.",
                files: [
                  "test/job_application_test.dart",
                ],
                rationale:
                  "Existing applications must continue to work without the new value.",
              },
            ],
            affectedFiles: [
              "lib/models/job_application.dart",
              "lib/providers/application_provider.dart",
              "lib/screens/add_edit_job_screen.dart",
              "test/job_application_test.dart",
            ],
            validationSteps: [
              "Run flutter analyze.",
              "Run flutter test.",
            ],
            risks: [
              "Existing applications do not contain interview dates.",
            ],
            assumptions: [
              "Interview dates are optional.",
            ],
            requiresHumanInput: false,
          }),
          model: "demo-planner",
        };
      }
  
      throw new Error(
        "DemoPlanningProvider received an unexpected model call.",
      );
    }
  }