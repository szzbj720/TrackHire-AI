import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import {
    ExplorationCandidateValidator,
  } from "./exploration-candidate-validator.js";
  
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
        "Extend the existing application model while preserving backward compatibility.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add an optional interviewDate field.",
      ],
  
      validationSteps: [
        "Run flutter test.",
      ],
  
      advantages: [
        "Keeps the change close to the existing model.",
      ],
  
      risks: [
        "Existing persisted data must remain compatible.",
      ],
  
      assumptions: [
        "Missing interview dates deserialize as null.",
      ],
  
      requiresHumanInput: false,
      confidence: 0.9,
  
      ...overrides,
    };
  }
  
  const repositoryFiles = [
    "lib/models/job_application.dart",
    "lib/providers/application_provider.dart",
    "test/job_application_test.dart",
  ];
  
  describe(
    "ExplorationCandidateValidator",
    () => {
      const validator =
        new ExplorationCandidateValidator();
  
      it("accepts a structurally valid candidate", () => {
        const result =
          validator.validate(
            [createCandidate()],
            repositoryFiles,
          );
  
        expect(
          result.results,
        ).toEqual([
          {
            candidateId:
              "candidate-a",
            valid: true,
            issues: [],
          },
        ]);
      });
  
      it("rejects a candidate that requires human input", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                requiresHumanInput:
                  true,
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          valid: false,
        });
  
        expect(
          result.results[0]?.issues,
        ).toContainEqual({
          code:
            "REQUIRES_HUMAN_INPUT",
          message:
            "Candidate requires human clarification before implementation.",
        });
      });
  
      it("rejects a candidate with no affected files", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                affectedFiles: [],
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results[0]?.issues,
        ).toContainEqual({
          code:
            "NO_AFFECTED_FILES",
          message:
            "Candidate does not identify any affected repository files.",
        });
      });
  
      it("rejects unknown affected files", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                affectedFiles: [
                  "lib/unknown.dart",
                ],
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results[0]?.issues,
        ).toContainEqual({
          code:
            "UNKNOWN_AFFECTED_FILE",
          message:
            "Candidate references unknown repository file: lib/unknown.dart",
        });
      });
  
      it("rejects duplicate candidate IDs", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                targetId:
                  "explorer-a",
              }),
              createCandidate({
                targetId:
                  "explorer-b",
                model: "model-b",
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results,
        ).toHaveLength(2);
  
        for (
          const candidateResult
          of result.results
        ) {
          expect(
            candidateResult.valid,
          ).toBe(false);
  
          expect(
            candidateResult.issues,
          ).toContainEqual({
            code:
              "DUPLICATE_CANDIDATE_ID",
            message:
              "Candidate ID is not unique: candidate-a",
          });
        }
      });
  
      it("reports multiple deterministic failures for the same candidate", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                affectedFiles: [],
                requiresHumanInput:
                  true,
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results[0]?.valid,
        ).toBe(false);
  
        expect(
          result.results[0]?.issues.map(
            (issue) => issue.code,
          ),
        ).toEqual([
          "REQUIRES_HUMAN_INPUT",
          "NO_AFFECTED_FILES",
        ]);
      });
  
      it("validates multiple independent candidates", () => {
        const result =
          validator.validate(
            [
              createCandidate({
                candidateId:
                  "candidate-a",
                targetId:
                  "explorer-a",
                model: "model-a",
              }),
              createCandidate({
                candidateId:
                  "candidate-b",
                targetId:
                  "explorer-b",
                model: "model-b",
                affectedFiles: [
                  "lib/providers/application_provider.dart",
                ],
              }),
            ],
            repositoryFiles,
          );
  
        expect(
          result.results.every(
            (candidateResult) =>
              candidateResult.valid,
          ),
        ).toBe(true);
      });
    },
  );