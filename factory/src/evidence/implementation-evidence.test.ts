import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import {
    combineImplementationEvidence,
  } from "./implementation-evidence.js";
  
  function createImplementation():
    ImplementationResult {
    return {
      summary:
        "Added interview date support.",
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Added optional interview date.",
        },
      ],
      commandsRun: [],
      assumptions: [
        "Interview date is optional.",
      ],
      warnings: [],
      requiresHumanInput: false,
    };
  }
  
  function createRepair():
    ImplementationResult {
    return {
      summary:
        "Repaired interview date support.",
      changedFiles: [
        {
          path:
            "lib/models/job_application.dart",
          changeType: "modified",
          summary:
            "Fixed interview date behavior.",
        },
        {
          path:
            "test/job_application_test.dart",
          changeType: "modified",
          summary:
            "Updated interview date tests.",
        },
      ],
      commandsRun: [
        "flutter test",
      ],
      assumptions: [
        "Interview date is optional.",
      ],
      warnings: [
        "Migration behavior should be monitored.",
      ],
      requiresHumanInput: false,
    };
  }
  
  describe(
    "combineImplementationEvidence",
    () => {
      it("returns the original implementation when there are no repairs", () => {
        const implementation =
          createImplementation();
  
        const result =
          combineImplementationEvidence(
            implementation,
            [],
          );
  
        expect(result).toEqual(
          implementation,
        );
      });
  
      it("combines original implementation and repair evidence", () => {
        const result =
          combineImplementationEvidence(
            createImplementation(),
            [createRepair()],
          );
  
        expect(result.changedFiles).toEqual([
          {
            path:
              "lib/models/job_application.dart",
            changeType: "modified",
            summary:
              "Fixed interview date behavior.",
          },
          {
            path:
              "test/job_application_test.dart",
            changeType: "modified",
            summary:
              "Updated interview date tests.",
          },
        ]);
  
        expect(result.commandsRun).toEqual([
          "flutter test",
        ]);
  
        expect(result.assumptions).toEqual([
          "Interview date is optional.",
        ]);
  
        expect(result.warnings).toEqual([
          "Migration behavior should be monitored.",
        ]);
  
        expect(
          result.requiresHumanInput,
        ).toBe(false);
      });
  
      it("propagates human input requirements from any result", () => {
        const repair = createRepair();
        repair.requiresHumanInput = true;
  
        const result =
          combineImplementationEvidence(
            createImplementation(),
            [repair],
          );
  
        expect(
          result.requiresHumanInput,
        ).toBe(true);
      });
    },
  );