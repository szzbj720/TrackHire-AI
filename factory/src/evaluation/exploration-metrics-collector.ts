import type {
    ExplorationGenerationResult,
  } from "../models/exploration-candidate-generator.js";
  import type {
    ExplorationImplementationRunResult,
  } from "../models/exploration-implementation-runner.js";
  import type {
    ExplorationImplementationSelection,
  } from "../models/exploration-implementation-selector.js";
  import type {
    ExplorationValidationRunResult,
  } from "../models/exploration-implementation-validator.js";
  import {
    explorationMetricsSchema,
  } from "../schemas/exploration-metrics.js";
  import type {
    ExplorationMetrics,
  } from "../schemas/exploration-metrics.js";
  
  export interface ExplorationMetricsInput {
    generation:
      ExplorationGenerationResult;
  
    implementations:
      ExplorationImplementationRunResult;
  
    validations:
      ExplorationValidationRunResult;
  
    selection:
      ExplorationImplementationSelection;
  }
  
  export class ExplorationMetricsCollector {
    collect(
      input: ExplorationMetricsInput,
    ): ExplorationMetrics {
      const successfulGenerations =
        input.generation.results.filter(
          (result) =>
            result.status ===
            "success",
        );
  
      const candidateGenerationFailures =
        input.generation.results.filter(
          (result) =>
            result.status ===
            "error",
        ).length;
  
      const implementationSuccesses =
        input.implementations.results.filter(
          (result) =>
            result.status ===
            "success",
        ).length;
  
      const implementationFailures =
        input.implementations.results.filter(
          (result) =>
            result.status ===
            "error",
        ).length;
  
      const successfulValidations =
        input.validations.results.filter(
          (result) =>
            result.status ===
            "success",
        );
  
      const validationPasses =
        successfulValidations.filter(
          (result) =>
            result.status ===
              "success" &&
            result.validation.passed,
        ).length;
  
      const validationFailures =
        successfulValidations.filter(
          (result) =>
            result.status ===
              "success" &&
            !result.validation.passed,
        ).length;
  
      const validationErrors =
        input.validations.results.filter(
          (result) =>
            result.status ===
            "error",
        ).length;
  
      const validationSkipped =
        input.validations.results.filter(
          (result) =>
            result.status ===
            "skipped",
        ).length;
  
      const inputTokens =
        successfulGenerations.reduce(
          (total, result) => {
            if (
              result.status !==
              "success"
            ) {
              return total;
            }
  
            return (
              total +
              (result.usage
                ?.inputTokens ?? 0)
            );
          },
          0,
        );
  
      const outputTokens =
        successfulGenerations.reduce(
          (total, result) => {
            if (
              result.status !==
              "success"
            ) {
              return total;
            }
  
            return (
              total +
              (result.usage
                ?.outputTokens ?? 0)
            );
          },
          0,
        );
  
      const estimatedCostUsd =
        successfulGenerations.reduce(
          (total, result) => {
            if (
              result.status !==
              "success"
            ) {
              return total;
            }
  
            return (
              total +
              (result.usage
                ?.estimatedCostUsd ??
                0)
            );
          },
          0,
        );
  
      return explorationMetricsSchema.parse(
        {
          candidateCount:
            successfulGenerations.length,
  
          candidateGenerationFailures,
  
          implementationSuccesses,
  
          implementationFailures,
  
          validationPasses,
  
          validationFailures,
  
          validationErrors,
  
          validationSkipped,
  
          inputTokens,
  
          outputTokens,
  
          estimatedCostUsd,
  
          ...(input.selection
            .selectedCandidateId
            ? {
                selectedCandidateId:
                  input.selection
                    .selectedCandidateId,
              }
            : {}),
  
          requiredHumanSelection:
            input.selection
              .requiresHumanSelection,
  
          usableCandidateCount:
            input.selection.scores.filter(
              (score) =>
                score.eligible,
            ).length,
        },
      );
    }
  }