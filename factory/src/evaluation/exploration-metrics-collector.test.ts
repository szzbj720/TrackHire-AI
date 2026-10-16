import {
    describe,
    expect,
    it,
  } from "vitest";
  
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
    ExplorationMetricsCollector,
  } from "./exploration-metrics-collector.js";
  
  function createGeneration():
    ExplorationGenerationResult {
    return {
      results: [
        {
          targetId: "explorer-a",
          status: "success",
          candidate: {
            candidateId:
              "candidate-a",
            targetId: "explorer-a",
            model: "model-a",
            summary: "Candidate A",
            approach: "Approach A",
            affectedFiles: [
              "lib/a.dart",
            ],
            implementationSteps: [
              "Implement A",
            ],
            validationSteps: [
              "Run tests",
            ],
            advantages: [],
            risks: [],
            assumptions: [],
            requiresHumanInput: false,
            confidence: 0.9,
          },
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            estimatedCostUsd: 0.01,
          },
        },
        {
          targetId: "explorer-b",
          status: "success",
          candidate: {
            candidateId:
              "candidate-b",
            targetId: "explorer-b",
            model: "model-b",
            summary: "Candidate B",
            approach: "Approach B",
            affectedFiles: [
              "lib/b.dart",
            ],
            implementationSteps: [
              "Implement B",
            ],
            validationSteps: [
              "Run tests",
            ],
            advantages: [],
            risks: [],
            assumptions: [],
            requiresHumanInput: false,
            confidence: 0.8,
          },
          usage: {
            inputTokens: 120,
            outputTokens: 60,
            estimatedCostUsd: 0.02,
          },
        },
        {
          targetId: "explorer-c",
          status: "error",
          error:
            "Provider unavailable",
        },
      ],
    };
  }
  
  function createImplementations():
    ExplorationImplementationRunResult {
    return {
      results: [
        {
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          status: "success",
          implementation: {
            summary:
              "Implemented A",
            changedFiles: [],
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          },
        },
        {
          candidateId:
            "candidate-b",
          targetId: "explorer-b",
          model: "model-b",
          status: "error",
          error:
            "Implementation failed",
        },
      ],
    };
  }
  
  function createValidations():
    ExplorationValidationRunResult {
    return {
      results: [
        {
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          status: "success",
          validation: {
            passed: true,
            checks: [],
            failedChecks: [],
            durationMs: 100,
          },
        },
        {
          candidateId:
            "candidate-b",
          targetId: "explorer-b",
          model: "model-b",
          status: "skipped",
          reason:
            "Implementation failed before deterministic validation.",
        },
      ],
    };
  }
  
  function createSelection():
    ExplorationImplementationSelection {
    return {
      scores: [
        {
          candidateId:
            "candidate-a",
          eligible: true,
          validationPassed: true,
          failedChecks: 0,
          proposalScore: 80,
          reasons: [],
        },
        {
          candidateId:
            "candidate-b",
          eligible: false,
          validationPassed: false,
          failedChecks: 0,
          proposalScore: 70,
          reasons: [],
        },
      ],
      selectedCandidateId:
        "candidate-a",
      tiedCandidateIds: [],
      requiresHumanSelection: false,
    };
  }
  
  describe(
    "ExplorationMetricsCollector",
    () => {
      it("collects exploration outcome metrics", () => {
        const collector =
          new ExplorationMetricsCollector();
  
        const metrics =
          collector.collect({
            generation:
              createGeneration(),
            implementations:
              createImplementations(),
            validations:
              createValidations(),
            selection:
              createSelection(),
          });
  
        expect(metrics).toEqual({
          candidateCount: 2,
          candidateGenerationFailures: 1,
  
          implementationSuccesses: 1,
          implementationFailures: 1,
  
          validationPasses: 1,
          validationFailures: 0,
          validationErrors: 0,
          validationSkipped: 1,
  
          inputTokens: 220,
          outputTokens: 110,
          estimatedCostUsd: 0.03,
  
          selectedCandidateId:
            "candidate-a",
  
          requiredHumanSelection: false,
  
          usableCandidateCount: 1,
        });
      });
  
      it("counts deterministic validation failures separately from infrastructure errors", () => {
        const collector =
          new ExplorationMetricsCollector();
  
        const validations:
          ExplorationValidationRunResult = {
          results: [
            {
              candidateId:
                "candidate-a",
              targetId:
                "explorer-a",
              model: "model-a",
              status: "success",
              validation: {
                passed: false,
                checks: [],
                failedChecks: [
                  "flutter test",
                ],
                durationMs: 100,
              },
            },
            {
              candidateId:
                "candidate-b",
              targetId:
                "explorer-b",
              model: "model-b",
              status: "error",
              error:
                "Validator crashed",
            },
          ],
        };
  
        const metrics =
          collector.collect({
            generation:
              createGeneration(),
            implementations:
              createImplementations(),
            validations,
            selection:
              createSelection(),
          });
  
        expect(
          metrics.validationFailures,
        ).toBe(1);
  
        expect(
          metrics.validationErrors,
        ).toBe(1);
      });
  
      it("aggregates model usage across successful candidate generations", () => {
        const collector =
          new ExplorationMetricsCollector();
  
        const metrics =
          collector.collect({
            generation:
              createGeneration(),
            implementations:
              createImplementations(),
            validations:
              createValidations(),
            selection:
              createSelection(),
          });
  
        expect(
          metrics.inputTokens,
        ).toBe(220);
  
        expect(
          metrics.outputTokens,
        ).toBe(110);
  
        expect(
          metrics.estimatedCostUsd,
        ).toBeCloseTo(0.03);
      });
  
      it("does not invent usage for failed generations", () => {
        const generation:
          ExplorationGenerationResult = {
          results: [
            {
              targetId:
                "explorer-a",
              status: "error",
              error:
                "Provider unavailable",
            },
          ],
        };
  
        const collector =
          new ExplorationMetricsCollector();
  
        const metrics =
          collector.collect({
            generation,
            implementations: {
              results: [],
            },
            validations: {
              results: [],
            },
            selection: {
              scores: [],
              tiedCandidateIds: [],
              requiresHumanSelection:
                true,
            },
          });
  
        expect(
          metrics.candidateCount,
        ).toBe(0);
  
        expect(
          metrics.candidateGenerationFailures,
        ).toBe(1);
  
        expect(
          metrics.inputTokens,
        ).toBe(0);
  
        expect(
          metrics.outputTokens,
        ).toBe(0);
  
        expect(
          metrics.estimatedCostUsd,
        ).toBe(0);
      });
  
      it("records human selection when no automatic winner exists", () => {
        const collector =
          new ExplorationMetricsCollector();
  
        const metrics =
          collector.collect({
            generation:
              createGeneration(),
            implementations:
              createImplementations(),
            validations:
              createValidations(),
            selection: {
              scores: [
                {
                  candidateId:
                    "candidate-a",
                  eligible: true,
                  validationPassed: true,
                  failedChecks: 0,
                  proposalScore: 80,
                  reasons: [],
                },
                {
                  candidateId:
                    "candidate-b",
                  eligible: true,
                  validationPassed: true,
                  failedChecks: 0,
                  proposalScore: 80,
                  reasons: [],
                },
              ],
              tiedCandidateIds: [
                "candidate-a",
                "candidate-b",
              ],
              requiresHumanSelection:
                true,
            },
          });
  
        expect(
          metrics.selectedCandidateId,
        ).toBeUndefined();
  
        expect(
          metrics.requiredHumanSelection,
        ).toBe(true);
  
        expect(
          metrics.usableCandidateCount,
        ).toBe(2);
      });
    },
  );