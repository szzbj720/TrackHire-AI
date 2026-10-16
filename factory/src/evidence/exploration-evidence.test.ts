import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ExplorationEvidence,
  } from "./exploration-evidence.js";
  import {
    createExplorationEvidence,
  } from "./exploration-evidence.js";
  
  function createEvidence():
    ExplorationEvidence {
    return {
      candidates: [
        {
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          summary:
            "Candidate A",
          approach:
            "Approach A",
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
        {
          candidateId:
            "candidate-b",
          targetId: "explorer-b",
          model: "model-b",
          summary:
            "Candidate B",
          approach:
            "Approach B",
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
      ],
  
      implementations: [
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
          status: "success",
          implementation: {
            summary:
              "Implemented B",
            changedFiles: [],
            commandsRun: [],
            assumptions: [],
            warnings: [],
            requiresHumanInput: false,
          },
        },
      ],
  
      validations: [
        {
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
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
          targetId: "explorer-b",
          model: "model-b",
          status: "success",
          validation: {
            passed: true,
            checks: [],
            failedChecks: [],
            durationMs: 100,
          },
        },
      ],
  
      selection: {
        scores: [
          {
            candidateId:
              "candidate-a",
            eligible: false,
            validationPassed: false,
            failedChecks: 1,
            proposalScore: 90,
            reasons: [
              "Candidate failed deterministic validation.",
            ],
          },
          {
            candidateId:
              "candidate-b",
            eligible: true,
            validationPassed: true,
            failedChecks: 0,
            proposalScore: 70,
            reasons: [
              "Candidate passed deterministic validation.",
            ],
          },
        ],
  
        selectedCandidateId:
          "candidate-b",
  
        tiedCandidateIds: [],
  
        requiresHumanSelection: false,
      },
  
      metrics: {
        candidateCount: 2,
        candidateGenerationFailures: 0,
  
        implementationSuccesses: 2,
        implementationFailures: 0,
  
        validationPasses: 1,
        validationFailures: 1,
        validationErrors: 0,
        validationSkipped: 0,
  
        inputTokens: 200,
        outputTokens: 100,
        estimatedCostUsd: 0.02,
  
        selectedCandidateId:
          "candidate-b",
  
        requiredHumanSelection: false,
  
        usableCandidateCount: 1,
      },
    };
  }
  
  describe(
    "createExplorationEvidence",
    () => {
      it("preserves competing candidates", () => {
        const evidence =
          createExplorationEvidence(
            createEvidence(),
          );
  
        expect(
          evidence.candidates.map(
            (candidate) =>
              candidate.candidateId,
          ),
        ).toEqual([
          "candidate-a",
          "candidate-b",
        ]);
      });
  
      it("preserves implementation evidence for every candidate", () => {
        const evidence =
          createExplorationEvidence(
            createEvidence(),
          );
  
        expect(
          evidence.implementations,
        ).toHaveLength(2);
  
        expect(
          evidence.implementations[1],
        ).toMatchObject({
          candidateId:
            "candidate-b",
          status: "success",
        });
      });
  
      it("preserves deterministic validation evidence", () => {
        const evidence =
          createExplorationEvidence(
            createEvidence(),
          );
  
        expect(
          evidence.validations[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          status: "success",
          validation: {
            passed: false,
          },
        });
  
        expect(
          evidence.validations[1],
        ).toMatchObject({
          candidateId:
            "candidate-b",
          status: "success",
          validation: {
            passed: true,
          },
        });
      });
  
      it("preserves the final selection decision and metrics", () => {
        const evidence =
          createExplorationEvidence(
            createEvidence(),
          );
  
        expect(
          evidence.selection
            .selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          evidence.metrics,
        ).toMatchObject({
          validationPasses: 1,
          validationFailures: 1,
          selectedCandidateId:
            "candidate-b",
        });
      });
    },
  );