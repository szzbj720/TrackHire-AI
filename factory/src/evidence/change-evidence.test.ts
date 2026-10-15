import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    GitDiffEvidence,
  } from "../tools/git-diff.js";
  import {
    buildChangeEvidence,
  } from "./change-evidence.js";
  
  function createPlan(
    affectedFiles: string[] = [
      "lib/models/job_application.dart",
    ],
  ): ImplementationPlan {
    return {
      summary:
        "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: affectedFiles,
          rationale:
            "The model needs to store the interview date.",
        },
      ],
      affectedFiles,
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
      risks: [],
      assumptions: [
        "Interview date is optional.",
      ],
      requiresHumanInput: false,
    };
  }
  
  function createImplementation(
    changedFiles: string[] = [
      "lib/models/job_application.dart",
    ],
  ): ImplementationResult {
    return {
      summary:
        "Added interview date support.",
      changedFiles:
        changedFiles.map((path) => ({
          path,
          changeType:
            "modified" as const,
          summary:
            `Modified ${path}.`,
        })),
      commandsRun: [],
      assumptions: [],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createGitDiff(
    changedFiles: string[] = [
      "lib/models/job_application.dart",
    ],
  ): GitDiffEvidence {
    return {
      changedFiles,
      patch:
        "diff --git a/lib/models/job_application.dart b/lib/models/job_application.dart",
    };
  }
  
  describe("buildChangeEvidence", () => {
    it("reports agreement when approved, reported, and observed files match", () => {
      const evidence =
        buildChangeEvidence(
          createPlan(),
          createImplementation(),
          createGitDiff(),
        );
  
      expect(
        evidence.withinApprovedScope,
      ).toBe(true);
  
      expect(
        evidence.reportMatchesObserved,
      ).toBe(true);
  
      expect(
        evidence.unreportedFiles,
      ).toEqual([]);
  
      expect(
        evidence.missingReportedFiles,
      ).toEqual([]);
  
      expect(
        evidence.unapprovedFiles,
      ).toEqual([]);
    });
  
    it("detects an observed change that the agent did not report or receive approval for", () => {
      const evidence =
        buildChangeEvidence(
          createPlan(),
          createImplementation(),
          createGitDiff([
            "lib/models/job_application.dart",
            "lib/providers/application_provider.dart",
          ]),
        );
  
      expect(
        evidence.withinApprovedScope,
      ).toBe(false);
  
      expect(
        evidence.reportMatchesObserved,
      ).toBe(false);
  
      expect(
        evidence.unreportedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(
        evidence.unapprovedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(
        evidence.missingReportedFiles,
      ).toEqual([]);
    });
  
    it("detects a file the agent reported but Git did not observe", () => {
      const evidence =
        buildChangeEvidence(
          createPlan([
            "lib/models/job_application.dart",
            "lib/providers/application_provider.dart",
          ]),
          createImplementation([
            "lib/models/job_application.dart",
            "lib/providers/application_provider.dart",
          ]),
          createGitDiff([
            "lib/models/job_application.dart",
          ]),
        );
  
      expect(
        evidence.withinApprovedScope,
      ).toBe(true);
  
      expect(
        evidence.reportMatchesObserved,
      ).toBe(false);
  
      expect(
        evidence.missingReportedFiles,
      ).toEqual([
        "lib/providers/application_provider.dart",
      ]);
  
      expect(
        evidence.unreportedFiles,
      ).toEqual([]);
    });
  
    it("removes duplicate file paths before comparing evidence", () => {
      const evidence =
        buildChangeEvidence(
          createPlan([
            "lib/models/job_application.dart",
            "lib/models/job_application.dart",
          ]),
          createImplementation([
            "lib/models/job_application.dart",
            "lib/models/job_application.dart",
          ]),
          createGitDiff([
            "lib/models/job_application.dart",
            "lib/models/job_application.dart",
          ]),
        );
  
      expect(
        evidence.approvedFiles,
      ).toEqual([
        "lib/models/job_application.dart",
      ]);
  
      expect(
        evidence.reportedFiles,
      ).toEqual([
        "lib/models/job_application.dart",
      ]);
  
      expect(
        evidence.observedFiles,
      ).toEqual([
        "lib/models/job_application.dart",
      ]);
  
      expect(
        evidence.reportMatchesObserved,
      ).toBe(true);
    });
  });