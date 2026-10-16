import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    evaluateDisagreementEscalation,
  } from "./disagreement-escalation-policy.js";
  import type {
    ModelDisagreement,
    ModelReviewJudgment,
  } from "./model-disagreement.js";
  
  function createJudgment(
    overrides: Partial<ModelReviewJudgment> = {},
  ): ModelReviewJudgment {
    return {
      targetId: "reviewer-a",
      model: "model-a",
      approved: true,
      requiresHumanInput: false,
      confidence: 0.9,
      ...overrides,
    };
  }
  
  function createDisagreement(
    overrides: Partial<ModelDisagreement> = {},
  ): ModelDisagreement {
    return {
      disagreed: false,
      reasons: [],
      judgments: [
        createJudgment(),
        createJudgment({
          targetId: "reviewer-b",
          model: "model-b",
        }),
      ],
      ...overrides,
    };
  }
  
  describe(
    "evaluateDisagreementEscalation",
    () => {
      it("continues when reviewers agree with sufficient confidence", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement(),
            taskRisk: "high",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: false,
          reasons: [],
        });
      });
  
      it("escalates whenever a model explicitly requests human input", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                judgments: [
                  createJudgment(),
                  createJudgment({
                    targetId:
                      "reviewer-b",
                    model: "model-b",
                    requiresHumanInput:
                      true,
                  }),
                ],
              }),
            taskRisk: "low",
          });
  
        expect(
          decision.requiresHumanInput,
        ).toBe(true);
  
        expect(decision.reasons).toContain(
          "model-requested-human-input",
        );
      });
  
      it("escalates disagreement for medium-risk work", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                disagreed: true,
                reasons: ["approval"],
              }),
            taskRisk: "medium",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: true,
          reasons: [
            "material-model-disagreement",
          ],
        });
      });
  
      it("escalates disagreement for high-risk work", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                disagreed: true,
                reasons: ["approval"],
              }),
            taskRisk: "high",
          });
  
        expect(
          decision.requiresHumanInput,
        ).toBe(true);
  
        expect(decision.reasons).toContain(
          "material-model-disagreement",
        );
      });
  
      it("records but does not automatically escalate low-risk disagreement", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                disagreed: true,
                reasons: ["approval"],
              }),
            taskRisk: "low",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: false,
          reasons: [],
        });
      });
  
      it("escalates low confidence for high-risk work", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                judgments: [
                  createJudgment(),
                  createJudgment({
                    targetId:
                      "reviewer-b",
                    model: "model-b",
                    confidence: 0.55,
                  }),
                ],
              }),
            taskRisk: "high",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: true,
          reasons: [
            "low-confidence-high-risk",
          ],
        });
      });
  
      it("does not automatically escalate low confidence for medium-risk work", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                judgments: [
                  createJudgment({
                    confidence: 0.5,
                  }),
                  createJudgment({
                    targetId:
                      "reviewer-b",
                    model: "model-b",
                    confidence: 0.6,
                  }),
                ],
              }),
            taskRisk: "medium",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: false,
          reasons: [],
        });
      });
  
      it("supports a custom confidence threshold", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                judgments: [
                  createJudgment({
                    confidence: 0.8,
                  }),
                  createJudgment({
                    targetId:
                      "reviewer-b",
                    model: "model-b",
                    confidence: 0.85,
                  }),
                ],
              }),
            taskRisk: "high",
            minimumConfidence: 0.9,
          });
  
        expect(
          decision.requiresHumanInput,
        ).toBe(true);
  
        expect(decision.reasons).toContain(
          "low-confidence-high-risk",
        );
      });
  
      it("rejects an invalid confidence threshold", () => {
        expect(() =>
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement(),
            taskRisk: "high",
            minimumConfidence: 1.1,
          }),
        ).toThrow(
          "Minimum confidence must be between 0 and 1.",
        );
      });
  
      it("preserves multiple independent escalation reasons", () => {
        const decision =
          evaluateDisagreementEscalation({
            disagreement:
              createDisagreement({
                disagreed: true,
                reasons: [
                  "approval",
                  "human-input",
                ],
                judgments: [
                  createJudgment({
                    approved: true,
                  }),
                  createJudgment({
                    targetId:
                      "reviewer-b",
                    model: "model-b",
                    approved: false,
                    requiresHumanInput:
                      true,
                    confidence: 0.4,
                  }),
                ],
              }),
            taskRisk: "high",
          });
  
        expect(decision).toEqual({
          requiresHumanInput: true,
          reasons: [
            "model-requested-human-input",
            "material-model-disagreement",
            "low-confidence-high-risk",
          ],
        });
      });
    },
  );