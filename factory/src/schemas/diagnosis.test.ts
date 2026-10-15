import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    failureDiagnosisSchema,
  } from "./diagnosis.js";
  
  describe("failureDiagnosisSchema", () => {
    it("accepts a valid failure diagnosis", () => {
      const result =
        failureDiagnosisSchema.parse({
          category: "TEST_REGRESSION",
          summary:
            "An existing application model test failed.",
          evidence: [
            "flutter test exited with code 1",
            "job_application_test.dart failed",
          ],
          suspectedFiles: [
            "lib/models/job_application.dart",
          ],
          recommendedAction:
            "Inspect the model change and repair the regression.",
          repairable: true,
          confidence: 0.9,
          requiresHumanInput: false,
        });
  
      expect(result.category).toBe(
        "TEST_REGRESSION",
      );
  
      expect(result.repairable).toBe(true);
    });
  
    it("rejects confidence above one", () => {
      expect(() =>
        failureDiagnosisSchema.parse({
          category: "UNKNOWN",
          summary:
            "Unable to classify the failure.",
          evidence: [
            "Validation failed.",
          ],
          suspectedFiles: [],
          recommendedAction:
            "Request additional evidence.",
          repairable: false,
          confidence: 1.4,
          requiresHumanInput: true,
        }),
      ).toThrow();
    });
  
    it("rejects negative confidence", () => {
      expect(() =>
        failureDiagnosisSchema.parse({
          category:
            "REQUIREMENT_AMBIGUITY",
          summary:
            "The requirement is ambiguous.",
          evidence: [
            "Two acceptance criteria conflict.",
          ],
          suspectedFiles: [],
          recommendedAction:
            "Ask a human to clarify the requirement.",
          repairable: false,
          confidence: -0.2,
          requiresHumanInput: true,
        }),
      ).toThrow();
    });
  
    it("requires diagnosis evidence", () => {
      expect(() =>
        failureDiagnosisSchema.parse({
          category:
            "INCORRECT_IMPLEMENTATION",
          summary:
            "The implementation is incorrect.",
          evidence: [],
          suspectedFiles: [],
          recommendedAction:
            "Repair the implementation.",
          repairable: true,
          confidence: 0.8,
          requiresHumanInput: false,
        }),
      ).toThrow();
    });
  });