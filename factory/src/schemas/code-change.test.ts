import { describe, expect, it } from "vitest";

import { codeChangeSetSchema } from "./code-change.js";

function createValidChangeSet() {
  return {
    summary: "Add optional interview date support.",
    writes: [
      {
        path: "lib/models/job_application.dart",
        content:
          "class JobApplication { /* updated */ }",
        summary:
          "Added optional interview date support.",
      },
    ],
    assumptions: [
      "Existing applications may not have an interview date.",
    ],
    warnings: [],
    requiresHumanInput: false,
  };
}

describe("codeChangeSetSchema", () => {
  it("accepts a valid code change set", () => {
    const result = codeChangeSetSchema.parse(
      createValidChangeSet(),
    );

    expect(result.writes).toHaveLength(1);

    expect(result.writes[0]?.path).toBe(
      "lib/models/job_application.dart",
    );
  });

  it("rejects a write without a path", () => {
    const result = createValidChangeSet();

    const invalidResult = {
      ...result,
      writes: [
        {
          ...result.writes[0],
          path: "",
        },
      ],
    };

    expect(() =>
      codeChangeSetSchema.parse(invalidResult),
    ).toThrow();
  });

  it("allows an empty write list when human input is required", () => {
    const result = {
      ...createValidChangeSet(),
      writes: [],
      requiresHumanInput: true,
    };

    expect(() =>
      codeChangeSetSchema.parse(result),
    ).not.toThrow();
  });
});