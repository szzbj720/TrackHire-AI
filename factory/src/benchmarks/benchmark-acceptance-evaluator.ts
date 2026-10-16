import type {
    BenchmarkAcceptanceCriterion,
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  export interface BenchmarkCriterionResult {
    criterionId: string;
    passed: boolean;
    evidence: string[];
  }
  
  export interface BenchmarkAcceptanceScore {
    criterionId: string;
    description: string;
    passed: boolean;
    evidence: string[];
  }
  
  export interface BenchmarkAcceptanceEvaluation {
    scenarioId: string;
  
    passed: boolean;
  
    passedCriteria: number;
    failedCriteria: number;
    totalCriteria: number;
  
    scores: BenchmarkAcceptanceScore[];
  
    missingCriterionIds: string[];
    unexpectedCriterionIds: string[];
  }
  
  function evaluateCriterion(
    criterion: BenchmarkAcceptanceCriterion,
    result:
      | BenchmarkCriterionResult
      | undefined,
  ): BenchmarkAcceptanceScore {
    if (!result) {
      return {
        criterionId:
          criterion.id,
  
        description:
          criterion.description,
  
        passed: false,
  
        evidence: [
          "No acceptance evidence was provided.",
        ],
      };
    }
  
    return {
      criterionId:
        criterion.id,
  
      description:
        criterion.description,
  
      passed:
        result.passed,
  
      evidence:
        [...result.evidence],
    };
  }
  
  export class BenchmarkAcceptanceEvaluator {
    evaluate(
      scenario: BenchmarkScenario,
      results: BenchmarkCriterionResult[],
    ): BenchmarkAcceptanceEvaluation {
      const resultByCriterionId =
        new Map<
          string,
          BenchmarkCriterionResult
        >();
  
      for (const result of results) {
        if (
          resultByCriterionId.has(
            result.criterionId,
          )
        ) {
          throw new Error(
            `Duplicate benchmark criterion result: ${result.criterionId}.`,
          );
        }
  
        resultByCriterionId.set(
          result.criterionId,
          result,
        );
      }
  
      const expectedCriterionIds =
        new Set(
          scenario.acceptanceCriteria.map(
            (criterion) =>
              criterion.id,
          ),
        );
  
      const unexpectedCriterionIds =
        results
          .map(
            (result) =>
              result.criterionId,
          )
          .filter(
            (criterionId) =>
              !expectedCriterionIds.has(
                criterionId,
              ),
          );
  
      const scores =
        scenario.acceptanceCriteria.map(
          (criterion) =>
            evaluateCriterion(
              criterion,
              resultByCriterionId.get(
                criterion.id,
              ),
            ),
        );
  
      const missingCriterionIds =
        scores
          .filter(
            (score) =>
              score.evidence.length === 1 &&
              score.evidence[0] ===
                "No acceptance evidence was provided.",
          )
          .map(
            (score) =>
              score.criterionId,
          );
  
      const passedCriteria =
        scores.filter(
          (score) =>
            score.passed,
        ).length;
  
      const failedCriteria =
        scores.length -
        passedCriteria;
  
      const passed =
        failedCriteria === 0 &&
        unexpectedCriterionIds.length === 0;
  
      return {
        scenarioId:
          scenario.id,
  
        passed,
  
        passedCriteria,
        failedCriteria,
  
        totalCriteria:
          scores.length,
  
        scores,
  
        missingCriterionIds,
        unexpectedCriterionIds,
      };
    }
  }