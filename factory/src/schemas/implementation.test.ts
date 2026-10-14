import { describe, expect, it } from "vitest";

import { implementationResultSchema } from "./implementation.js";

function createValidResult() {
  return {
    summary: "Added optional interview date support.",
    changedFiles: [
      {
        path: "lib/models/job_application.dart",
        changeType: "modified" as const,
        summary:
          "Added an optional interviewDate field.",
      },
    ],
    commandsRun: [
      "flutter analyze",
      "flutter test",
    ],
    assumptions: [
      "Existing applications may not have an interview date.",
    ],
    warnings: [],
    requiresHumanInput: false,
  };
}

describe("implementationResultSchema", () => {
  it("accepts a valid implementation result", () => {
    const result =
      implementationResultSchema.parse(
        createValidResult(),
      );

    expect(result.summary).toBe(
      "Added optional interview date support.",
    );

    expect(result.changedFiles).toHaveLength(1);

    expect(result.changedFiles[0]?.changeType).toBe(
      "modified",
    );
  });

  it("rejects an invalid file change type", () => {
    const result = createValidResult();

    const invalidResult = {
      ...result,
      changedFiles: [
        {
          ...result.changedFiles[0],
          changeType: "renamed",
        },
      ],
    };

    expect(() =>
      implementationResultSchema.parse(
        invalidResult,
      ),
    ).toThrow();
  });

  it("rejects a changed file without a path", () => {
    const result = createValidResult();

    const invalidResult = {
      ...result,
      changedFiles: [
        {
          ...result.changedFiles[0],
          path: "",
        },
      ],
    };

    expect(() =>
      implementationResultSchema.parse(
        invalidResult,
      ),
    ).toThrow();
  });
});