import { describe, expect, it } from "vitest";

import { implementationPlanSchema } from "./plan.js";

describe("implementationPlanSchema", () => {
  it("accepts a valid implementation plan", () => {
    const plan = {
      summary: "Add interview date support to applications.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model to support an optional interview date.",
          files: ["lib/models/job_application.dart"],
          rationale:
            "The application model needs to represent the new data.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run Flutter tests.",
        "Run Flutter static analysis.",
      ],
      risks: [
        "Existing applications may not contain an interview date.",
      ],
      assumptions: [
        "Interview dates are optional.",
      ],
      requiresHumanInput: false,
    };

    const result =
      implementationPlanSchema.safeParse(plan);

    expect(result.success).toBe(true);
  });

  it("rejects a plan with no implementation steps", () => {
    const plan = {
      summary: "Invalid plan",
      steps: [],
      affectedFiles: [],
      validationSteps: ["Run tests."],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };

    const result =
      implementationPlanSchema.safeParse(plan);

    expect(result.success).toBe(false);
  });

  it("rejects a plan with no validation steps", () => {
    const plan = {
      summary: "Invalid plan",
      steps: [
        {
          order: 1,
          description: "Change the application model.",
          files: ["lib/models/job_application.dart"],
          rationale: "Support interview dates.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [],
      risks: [],
      assumptions: [],
      requiresHumanInput: false,
    };

    const result =
      implementationPlanSchema.safeParse(plan);

    expect(result.success).toBe(false);
  });
});