import {
    mkdtemp,
    rm,
  } from "node:fs/promises";
  import {
    tmpdir,
  } from "node:os";
  import {
    join,
  } from "node:path";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ExplorationEvidence,
  } from "../evidence/exploration-evidence.js";
  import {
    ExplorationArtifactStore,
  } from "./exploration-artifact-store.js";
  import {
    RunArtifactStore,
  } from "./run-artifact-store.js";
  
  const temporaryDirectories:
    string[] = [];
  
  async function createStore():
    Promise<ExplorationArtifactStore> {
    const root = await mkdtemp(
      join(
        tmpdir(),
        "factory-exploration-",
      ),
    );
  
    temporaryDirectories.push(root);
  
    return new ExplorationArtifactStore(
      new RunArtifactStore(root),
    );
  }
  
  function createEvidence():
    ExplorationEvidence {
    return {
      candidates: [
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
            "lib/models/job_application.dart",
          ],
          implementationSteps: [
            "Add interview date.",
          ],
          validationSteps: [
            "Run flutter test.",
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
            "candidate-b",
          targetId: "explorer-b",
          model: "model-b",
          status: "success",
          implementation: {
            summary:
              "Implemented candidate B.",
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
        candidateCount: 1,
        candidateGenerationFailures: 0,
  
        implementationSuccesses: 1,
        implementationFailures: 0,
  
        validationPasses: 1,
        validationFailures: 0,
        validationErrors: 0,
        validationSkipped: 0,
  
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0.01,
  
        selectedCandidateId:
          "candidate-b",
  
        requiredHumanSelection: false,
  
        usableCandidateCount: 1,
      },
    };
  }
  
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(
        (directory) =>
          rm(directory, {
            recursive: true,
            force: true,
          }),
      ),
    );
  });
  
  describe(
    "ExplorationArtifactStore",
    () => {
      it("persists exploration evidence using the run artifact store", async () => {
        const store =
          await createStore();
  
        const evidence =
          createEvidence();
  
        await store.writeEvidence(
          "run-001",
          evidence,
        );
  
        const restored =
          await store.readEvidence(
            "run-001",
          );
  
        expect(restored).toEqual(
          evidence,
        );
      });
  
      it("preserves the selected candidate across persistence", async () => {
        const store =
          await createStore();
  
        await store.writeEvidence(
          "run-001",
          createEvidence(),
        );
  
        const restored =
          await store.readEvidence(
            "run-001",
          );
  
        expect(
          restored.selection
            .selectedCandidateId,
        ).toBe("candidate-b");
  
        expect(
          restored.metrics
            .selectedCandidateId,
        ).toBe("candidate-b");
      });
  
      it("preserves deterministic validation evidence across persistence", async () => {
        const store =
          await createStore();
  
        await store.writeEvidence(
          "run-001",
          createEvidence(),
        );
  
        const restored =
          await store.readEvidence(
            "run-001",
          );
  
        expect(
          restored.validations[0],
        ).toMatchObject({
          candidateId:
            "candidate-b",
          status: "success",
          validation: {
            passed: true,
          },
        });
      });
    },
  );