import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    CandidateValidationResult,
  } from "./exploration-candidate-validator.js";
  import {
    ExplorationCandidateEvaluator,
  } from "./exploration-candidate-evaluator.js";
  
  function createCandidate(
    overrides:
      Partial<ExplorationCandidate> = {},
  ): ExplorationCandidate {
    return {
      candidateId: "candidate-a",
      targetId: "explorer-a",
      model: "model-a",
  
      summary:
        "Add interview date support.",
  
      approach:
        "Extend the existing application model.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add the optional interview date.",
      ],
  
      validationSteps: [
        "Run flutter test.",
      ],
  
      advantages: [
        "Small implementation scope.",
      ],
  
      risks: [
        "Persisted data must remain compatible.",
      ],
  
      assumptions: [
        "Missing dates deserialize as null.",
      ],
  
      requiresHumanInput: false,
      confidence: 0.9,
  
      ...overrides,
    };
  }
  
  function validResult(
    candidateId: string,
  ): CandidateValidationResult {
    return {
      candidateId,
      valid: true,
      issues: [],
    };
  }
  
  describe(
    "ExplorationCandidateEvaluator",
    () => {
      const evaluator =
        new ExplorationCandidateEvaluator();
  
      it("selects the highest-scoring eligible candidate", () => {
        const candidates = [
          createCandidate({
            candidateId:
              "candidate-a",
            confidence: 0.9,
          }),
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
            confidence: 0.7,
          }),
        ];
  
        const result =
          evaluator.evaluate(
            candidates,
            [
              validResult(
                "candidate-a",
              ),
              validResult(
                "candidate-b",
              ),
            ],
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-a");
  
        expect(
          result.requiresHumanSelection,
        ).toBe(false);
  
        expect(
          result.tiedCandidateIds,
        ).toEqual([]);
      });
  
      it("does not select a candidate that failed deterministic validation", () => {
        const candidates = [
          createCandidate({
            candidateId:
              "candidate-a",
            confidence: 1,
          }),
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
            confidence: 0.7,
          }),
        ];
  
        const invalidResult:
          CandidateValidationResult = {
            candidateId:
              "candidate-a",
            valid: false,
            issues: [
              {
                code:
                  "REQUIRES_HUMAN_INPUT",
                message:
                  "Candidate requires human clarification before implementation.",
              },
            ],
          };
  
        const result =
          evaluator.evaluate(
            candidates,
            [
              invalidResult,
              validResult(
                "candidate-b",
              ),
            ],
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
          score: 0,
        });
      });
  
      it("penalizes larger proposed file scope", () => {
        const candidates = [
          createCandidate({
            candidateId:
              "candidate-a",
            affectedFiles: [
              "lib/models/job_application.dart",
            ],
          }),
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
            affectedFiles: [
              "lib/models/job_application.dart",
              "lib/providers/application_provider.dart",
              "lib/screens/add_edit_job_screen.dart",
            ],
          }),
        ];
  
        const result =
          evaluator.evaluate(
            candidates,
            [
              validResult(
                "candidate-a",
              ),
              validResult(
                "candidate-b",
              ),
            ],
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-a");
      });
  
      it("penalizes additional declared risks and assumptions", () => {
        const candidates = [
          createCandidate({
            candidateId:
              "candidate-a",
          }),
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
            risks: [
              "Risk one.",
              "Risk two.",
              "Risk three.",
            ],
            assumptions: [
              "Assumption one.",
              "Assumption two.",
            ],
          }),
        ];
  
        const result =
          evaluator.evaluate(
            candidates,
            [
              validResult(
                "candidate-a",
              ),
              validResult(
                "candidate-b",
              ),
            ],
          );
  
        expect(
          result.selectedCandidateId,
        ).toBe("candidate-a");
      });
  
      it("requires human selection when eligible candidates tie", () => {
        const candidates = [
          createCandidate({
            candidateId:
              "candidate-a",
          }),
          createCandidate({
            candidateId:
              "candidate-b",
            targetId:
              "explorer-b",
            model: "model-b",
          }),
        ];
  
        const result =
          evaluator.evaluate(
            candidates,
            [
              validResult(
                "candidate-a",
              ),
              validResult(
                "candidate-b",
              ),
            ],
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
  
      it("requires human selection when no candidate is eligible", () => {
        const candidate =
          createCandidate();
  
        const result =
          evaluator.evaluate(
            [candidate],
            [
              {
                candidateId:
                  "candidate-a",
                valid: false,
                issues: [
                  {
                    code:
                      "REQUIRES_HUMAN_INPUT",
                    message:
                      "Human clarification required.",
                  },
                ],
              },
            ],
          );
  
        expect(
          result.selectedCandidateId,
        ).toBeUndefined();
  
        expect(
          result.tiedCandidateIds,
        ).toEqual([]);
  
        expect(
          result.requiresHumanSelection,
        ).toBe(true);
      });
  
      it("treats missing validation evidence as ineligible", () => {
        const result =
          evaluator.evaluate(
            [createCandidate()],
            [],
          );
  
        expect(
          result.scores[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          eligible: false,
          score: 0,
        });
  
        expect(
          result.requiresHumanSelection,
        ).toBe(true);
      });
    },
  );