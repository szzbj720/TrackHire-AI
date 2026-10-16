import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    TaskAnalysis,
  } from "../schemas/task.js";
  import {
    ExplorationPolicy,
  } from "./exploration-policy.js";
  
  function createAnalysis(
    overrides: Partial<TaskAnalysis> = {},
  ): TaskAnalysis {
    return {
      complexity: "medium",
      risk: "medium",
      affectedAreas: [
        "application model",
      ],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: [],
      assumptions: [],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning:
        "The task changes application data.",
      ...overrides,
    };
  }
  
  describe("ExplorationPolicy", () => {
    const policy =
      new ExplorationPolicy();
  
    it("does not explore low-complexity work", () => {
      const decision =
        policy.decide(
          createAnalysis({
            complexity: "low",
          }),
        );
  
      expect(decision.explore).toBe(
        false,
      );
    });
  
    it("explores high-complexity work", () => {
      const decision =
        policy.decide(
          createAnalysis({
            complexity: "high",
          }),
        );
  
      expect(decision.explore).toBe(
        true,
      );
    });
  
    it("explores high-risk work", () => {
      const decision =
        policy.decide(
          createAnalysis({
            risk: "high",
          }),
        );
  
      expect(decision.explore).toBe(
        true,
      );
    });
  
    it("explores medium-complexity work when analysis confidence is low", () => {
      const decision =
        policy.decide(
          createAnalysis({
            complexity: "medium",
            confidence: 0.6,
          }),
        );
  
      expect(decision.explore).toBe(
        true,
      );
    });
  
    it("does not explore ordinary medium-complexity work with high confidence", () => {
      const decision =
        policy.decide(
          createAnalysis({
            complexity: "medium",
            risk: "medium",
            confidence: 0.9,
          }),
        );
  
      expect(decision.explore).toBe(
        false,
      );
    });
  
    it("does not explore while human clarification is required", () => {
      const decision =
        policy.decide(
          createAnalysis({
            complexity: "high",
            risk: "high",
            requiresHumanInput: true,
          }),
        );
  
      expect(decision.explore).toBe(
        false,
      );
    });
  });