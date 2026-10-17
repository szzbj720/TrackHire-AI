import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  import {
    BenchmarkAcceptanceEvaluator,
    type BenchmarkCriterionResult,
  } from "./benchmark-acceptance-evaluator.js";
  
  function passingResults():
    BenchmarkCriterionResult[] {
    return [
      {
        criterionId:
          "optional-date",
  
        passed: true,
  
        evidence: [
          "Existing applications pass without an interview date.",
        ],
      },
  
      {
        criterionId:
          "persist-date",
  
        passed: true,
  
        evidence: [
          "Serialization tests preserve the interview date.",
        ],
      },
  
      {
        criterionId:
          "edit-date",
  
        passed: true,
  
        evidence: [
          "The add/edit flow exposes interview date input.",
        ],
      },
  
      {
        criterionId:
          "upcoming-interviews",
  
        passed: true,
  
        evidence: [
          "Provider tests return future interviews in chronological order.",
        ],
      },
  
      {
        criterionId:
          "regression",
  
        passed: true,
  
        evidence: [
          "Flutter analysis and tests pass.",
        ],
      },
    ];
  }
  
  describe(
    "BenchmarkAcceptanceEvaluator",
    () => {
      it("passes when every acceptance criterion is satisfied", () => {
        const evaluator =
          new BenchmarkAcceptanceEvaluator();
  
        const evaluation =
          evaluator.evaluate(
            trackHireInterviewDateBenchmark,
            passingResults(),
          );
  
        expect(
          evaluation.passed,
        ).toBe(true);
  
        expect(
          evaluation.passedCriteria,
        ).toBe(5);
  
        expect(
          evaluation.failedCriteria,
        ).toBe(0);
  
        expect(
          evaluation.totalCriteria,
        ).toBe(5);
  
        expect(
          evaluation.missingCriterionIds,
        ).toEqual([]);
  
        expect(
          evaluation.unexpectedCriterionIds,
        ).toEqual([]);
      });
  
      it("fails when an acceptance criterion fails", () => {
        const evaluator =
          new BenchmarkAcceptanceEvaluator();
  
        const results =
          passingResults();
  
        const index =
          results.findIndex(
            (result) =>
              result.criterionId ===
              "upcoming-interviews",
          );
  
        results[index] = {
          criterionId:
            "upcoming-interviews",
  
          passed: false,
  
          evidence: [
            "Upcoming interviews were not sorted chronologically.",
          ],
        };
  
        const evaluation =
          evaluator.evaluate(
            trackHireInterviewDateBenchmark,
            results,
          );
  
        expect(
          evaluation.passed,
        ).toBe(false);
  
        expect(
          evaluation.passedCriteria,
        ).toBe(4);
  
        expect(
          evaluation.failedCriteria,
        ).toBe(1);
  
        expect(
          evaluation.scores.find(
            (score) =>
              score.criterionId ===
              "upcoming-interviews",
          ),
        ).toMatchObject({
          passed: false,
        });
      });
  
      it("treats missing acceptance evidence as a failure", () => {
        const evaluator =
          new BenchmarkAcceptanceEvaluator();
  
        const results =
          passingResults().filter(
            (result) =>
              result.criterionId !==
              "persist-date",
          );
  
        const evaluation =
          evaluator.evaluate(
            trackHireInterviewDateBenchmark,
            results,
          );
  
        expect(
          evaluation.passed,
        ).toBe(false);
  
        expect(
          evaluation.missingCriterionIds,
        ).toEqual([
          "persist-date",
        ]);
  
        expect(
          evaluation.scores.find(
            (score) =>
              score.criterionId ===
              "persist-date",
          ),
        ).toEqual({
          criterionId:
            "persist-date",
  
          description:
            "An interview date survives application serialization and deserialization.",
  
          passed: false,
  
          evidence: [
            "No acceptance evidence was provided.",
          ],
        });
      });
  
      it("rejects duplicate criterion results", () => {
        const evaluator =
          new BenchmarkAcceptanceEvaluator();
  
        const results =
          passingResults();
  
        results.push({
          criterionId:
            "optional-date",
  
          passed: true,
  
          evidence: [
            "Duplicate evidence.",
          ],
        });
  
        expect(() =>
          evaluator.evaluate(
            trackHireInterviewDateBenchmark,
            results,
          ),
        ).toThrow(
          "Duplicate benchmark criterion result: optional-date.",
        );
      });
  
      it("fails when evidence contains an unknown criterion", () => {
        const evaluator =
          new BenchmarkAcceptanceEvaluator();
  
        const results =
          passingResults();
  
        results.push({
          criterionId:
            "made-up-requirement",
  
          passed: true,
  
          evidence: [
            "Unknown evidence.",
          ],
        });
  
        const evaluation =
          evaluator.evaluate(
            trackHireInterviewDateBenchmark,
            results,
          );
  
        expect(
          evaluation.passed,
        ).toBe(false);
  
        expect(
          evaluation.unexpectedCriterionIds,
        ).toEqual([
          "made-up-requirement",
        ]);
      });
    },
  );