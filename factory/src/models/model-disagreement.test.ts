import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    evaluateModelDisagreement,
    type ModelReviewJudgment,
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
  
  describe("evaluateModelDisagreement", () => {
    it("reports agreement when models reach the same decision", () => {
      const result =
        evaluateModelDisagreement([
          createJudgment(),
          createJudgment({
            targetId: "reviewer-b",
            model: "model-b",
            confidence: 0.82,
          }),
        ]);
  
      expect(result.disagreed).toBe(
        false,
      );
  
      expect(result.reasons).toEqual(
        [],
      );
    });
  
    it("detects approval disagreement", () => {
      const result =
        evaluateModelDisagreement([
          createJudgment(),
          createJudgment({
            targetId: "reviewer-b",
            model: "model-b",
            approved: false,
          }),
        ]);
  
      expect(result.disagreed).toBe(
        true,
      );
  
      expect(result.reasons).toEqual([
        "approval",
      ]);
    });
  
    it("detects disagreement about human escalation", () => {
      const result =
        evaluateModelDisagreement([
          createJudgment(),
          createJudgment({
            targetId: "reviewer-b",
            model: "model-b",
            requiresHumanInput: true,
          }),
        ]);
  
      expect(result.disagreed).toBe(
        true,
      );
  
      expect(result.reasons).toEqual([
        "human-input",
      ]);
    });
  
    it("records multiple disagreement reasons", () => {
      const result =
        evaluateModelDisagreement([
          createJudgment(),
          createJudgment({
            targetId: "reviewer-b",
            model: "model-b",
            approved: false,
            requiresHumanInput: true,
          }),
        ]);
  
      expect(result.disagreed).toBe(
        true,
      );
  
      expect(result.reasons).toEqual([
        "approval",
        "human-input",
      ]);
    });
  
    it("does not treat different confidence values as disagreement", () => {
      const result =
        evaluateModelDisagreement([
          createJudgment({
            confidence: 0.95,
          }),
          createJudgment({
            targetId: "reviewer-b",
            model: "model-b",
            confidence: 0.55,
          }),
        ]);
  
      expect(result.disagreed).toBe(
        false,
      );
    });
  
    it("does not claim disagreement from only one judgment", () => {
      const judgment =
        createJudgment();
  
      const result =
        evaluateModelDisagreement([
          judgment,
        ]);
  
      expect(result).toEqual({
        disagreed: false,
        reasons: [],
        judgments: [judgment],
      });
    });
  
    it("does not claim disagreement without judgments", () => {
      const result =
        evaluateModelDisagreement([]);
  
      expect(result).toEqual({
        disagreed: false,
        reasons: [],
        judgments: [],
      });
    });
  
    it("preserves the independent judgments as evidence", () => {
      const judgments = [
        createJudgment(),
        createJudgment({
          targetId: "reviewer-b",
          model: "model-b",
          approved: false,
        }),
      ];
  
      const result =
        evaluateModelDisagreement(
          judgments,
        );
  
      expect(result.judgments).toEqual(
        judgments,
      );
  
      expect(
        result.judgments,
      ).not.toBe(judgments);
    });
  });