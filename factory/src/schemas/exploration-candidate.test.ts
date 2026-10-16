import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    explorationCandidateSchema,
  } from "./exploration-candidate.js";
  
  function createCandidate() {
    return {
      candidateId: "candidate-a",
      targetId: "explorer-a",
      model: "model-a",
  
      summary:
        "Add the interview date directly to the application model.",
  
      approach:
        "Extend the existing application model and preserve backward compatibility by keeping the field optional.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add an optional interviewDate field to the application model.",
        "Update serialization to preserve existing application data.",
      ],
  
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
  
      advantages: [
        "Keeps the change close to the existing application model.",
      ],
  
      risks: [
        "Existing persisted application data must continue to deserialize.",
      ],
  
      assumptions: [
        "Missing interview dates should deserialize as null.",
      ],
  
      requiresHumanInput: false,
  
      confidence: 0.9,
    };
  }
  
  describe(
    "explorationCandidateSchema",
    () => {
      it("accepts a valid exploration candidate", () => {
        const candidate =
          explorationCandidateSchema.parse(
            createCandidate(),
          );
  
        expect(
          candidate.candidateId,
        ).toBe("candidate-a");
  
        expect(candidate.model).toBe(
          "model-a",
        );
  
        expect(
          candidate.confidence,
        ).toBe(0.9);
      });
  
      it("rejects an empty candidate id", () => {
        expect(() =>
          explorationCandidateSchema.parse({
            ...createCandidate(),
            candidateId: "",
          }),
        ).toThrow();
      });
  
      it("rejects an empty implementation plan", () => {
        expect(() =>
          explorationCandidateSchema.parse({
            ...createCandidate(),
            implementationSteps: [],
          }),
        ).toThrow();
      });
  
      it("rejects an empty validation plan", () => {
        expect(() =>
          explorationCandidateSchema.parse({
            ...createCandidate(),
            validationSteps: [],
          }),
        ).toThrow();
      });
  
      it("rejects confidence below zero", () => {
        expect(() =>
          explorationCandidateSchema.parse({
            ...createCandidate(),
            confidence: -0.1,
          }),
        ).toThrow();
      });
  
      it("rejects confidence above one", () => {
        expect(() =>
          explorationCandidateSchema.parse({
            ...createCandidate(),
            confidence: 1.1,
          }),
        ).toThrow();
      });
  
      it("allows an exploration candidate to request human input", () => {
        const candidate =
          explorationCandidateSchema.parse({
            ...createCandidate(),
            requiresHumanInput: true,
          });
  
        expect(
          candidate.requiresHumanInput,
        ).toBe(true);
      });
    },
  );