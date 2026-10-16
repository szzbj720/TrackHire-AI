import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    CandidateEvaluationResult,
  } from "./exploration-candidate-evaluator.js";
  import type {
    ExplorationImplementationResult,
  } from "./exploration-implementation-runner.js";
  import type {
    ExplorationValidationResult,
  } from "./exploration-implementation-validator.js";
  import {
    ExplorationImplementationSelector,
  } from "./exploration-implementation-selector.js";
  
  function createImplementation(
    candidateId: string,
  ): ExplorationImplementationResult {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      status: "success",
      implementation: {
        summary:
          `Implemented ${candidateId}.`,
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
            changeType: "modified",
            summary:
              "Added interview date support.",
          },
        ],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
      },
    };
  }
  
  function createPassingValidation(
    candidateId: string,
  ): ExplorationValidationResult {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      status: "success",
      validation: {
        passed: true,
        checks: [
          {
            name: "flutter test",
            command: "flutter",
            args: ["test"],
            exitCode: 0,
            stdout:
              "All tests passed.",
            stderr: "",
            durationMs: 100,
            passed: true,
          },
        ],
        failedChecks: [],
        durationMs: 100,
      },
    };
  }
  
  function createFailingValidation(
    candidateId: string,
  ): ExplorationValidationResult {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      status: "success",
      validation: {
        passed: false,
        checks: [
          {
            name: "flutter test",
            command: "flutter",
            args: ["test"],
            exitCode: 1,
            stdout: "",
            stderr: "Test failed.",
            durationMs: 100,
            passed: false,
          },
        ],
        failedChecks: [
          "flutter test",
        ],
        durationMs: 100,
      },
    };
  }
  
  function createCandidateEvaluation(
    scores: Record<
      string,
      number
    >,
  ): CandidateEvaluationResult {
    return {
      scores: Object.entries(
        scores,
      ).map(
        ([candidateId, score]) => ({
          candidateId,
          eligible: true,
          score,
          reasons: [],
        }),
      ),
      tiedCandidateIds: [],
      requiresHumanSelection: false,
    };
  }
  
  describe(
    "ExplorationImplementationSelector",
    () => {
      const selector =
        new ExplorationImplementationSelector();
  
      it("selects the only implementation that passes deterministic validation", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createFailingValidation(
                "candidate-a",
              ),
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 95,
              "candidate-b": 60,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.requiresHumanSelection,
        ).toBe(false);
      });
  
      it("uses proposal score only after implementations pass validation", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createPassingValidation(
                "candidate-a",
              ),
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 80,
              "candidate-b": 70,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-a");
      });
  
      it("does not allow proposal confidence to rescue failing code", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createFailingValidation(
                "candidate-a",
              ),
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 100,
              "candidate-b": 1,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
      });
  
      it("requires human selection when all implementations fail validation", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createFailingValidation(
                "candidate-a",
              ),
              createFailingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 90,
              "candidate-b": 80,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBeUndefined();
  
        expect(
          result.requiresHumanSelection,
        ).toBe(true);
  
        expect(
          result.tiedCandidateIds,
        ).toEqual([]);
      });
  
      it("requires human selection when passing candidates have equal evidence", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createPassingValidation(
                "candidate-a",
              ),
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 80,
              "candidate-b": 80,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBeUndefined();
  
        expect(
          result.tiedCandidateIds,
        ).toEqual([
          "candidate-a",
          "candidate-b",
        ]);
  
        expect(
          result.requiresHumanSelection,
        ).toBe(true);
      });
  
      it("treats implementation errors as ineligible", () => {
        const failed:
          ExplorationImplementationResult = {
            candidateId:
              "candidate-a",
            targetId:
              "explorer-candidate-a",
            model:
              "model-candidate-a",
            status: "error",
            error:
              "Implementation failed",
          };
  
        const result =
          selector.select(
            [
              failed,
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 100,
              "candidate-b": 50,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.scores.find(
            (score) =>
              score.candidateId ===
              "candidate-a",
          ),
        ).toMatchObject({
          eligible: false,
        });
      });
  
      it("treats missing validation evidence as ineligible", () => {
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 100,
              "candidate-b": 50,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.scores.find(
            (score) =>
              score.candidateId ===
              "candidate-a",
          )?.reasons,
        ).toContain(
          "Candidate has no deterministic validation evidence.",
        );
      });
  
      it("treats validation infrastructure errors as ineligible", () => {
        const validationError:
          ExplorationValidationResult = {
            candidateId:
              "candidate-a",
            targetId:
              "explorer-candidate-a",
            model:
              "model-candidate-a",
            status: "error",
            error:
              "Validator crashed",
          };
  
        const result =
          selector.select(
            [
              createImplementation(
                "candidate-a",
              ),
              createImplementation(
                "candidate-b",
              ),
            ],
            [
              validationError,
              createPassingValidation(
                "candidate-b",
              ),
            ],
            createCandidateEvaluation({
              "candidate-a": 100,
              "candidate-b": 50,
            }),
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          result.scores.find(
            (score) =>
              score.candidateId ===
              "candidate-a",
          )?.reasons,
        ).toContain(
          "Candidate validation encountered an infrastructure error.",
        );
      });
    },
  );