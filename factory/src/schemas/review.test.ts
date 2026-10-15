import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    reviewResultSchema,
  } from "./review.js";
  
  describe("reviewResultSchema", () => {
    it("accepts a valid review result", () => {
      const result =
        reviewResultSchema.parse({
          approved: true,
          summary:
            "The implementation satisfies the approved task.",
          findings: [],
          requirementCoverage: [
            {
              requirement:
                "Interview date must be optional.",
              satisfied: true,
              evidence: [
                "The interview date field is nullable.",
              ],
            },
          ],
          requiresHumanInput: false,
          confidence: 0.92,
        });
  
      expect(result.approved).toBe(
        true,
      );
  
      expect(result.confidence).toBe(
        0.92,
      );
    });
  
    it("accepts review findings", () => {
      const result =
        reviewResultSchema.parse({
          approved: false,
          summary:
            "The implementation has a regression risk.",
          findings: [
            {
              severity: "HIGH",
              summary:
                "Existing behavior may not be preserved.",
              evidence: [
                "The constructor now requires a previously optional value.",
              ],
              files: [
                "lib/models/job_application.dart",
              ],
              recommendation:
                "Preserve backwards-compatible construction.",
            },
          ],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.88,
        });
  
      expect(
        result.findings,
      ).toHaveLength(1);
  
      expect(
        result.findings[0]?.severity,
      ).toBe("HIGH");
    });
  
    it("rejects confidence above one", () => {
      expect(() =>
        reviewResultSchema.parse({
          approved: true,
          summary:
            "Implementation approved.",
          findings: [],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 1.1,
        }),
      ).toThrow();
    });
  
    it("rejects findings without evidence", () => {
      expect(() =>
        reviewResultSchema.parse({
          approved: false,
          summary:
            "A problem was found.",
          findings: [
            {
              severity: "HIGH",
              summary:
                "Possible regression.",
              evidence: [],
              files: [
                "lib/models/job_application.dart",
              ],
              recommendation:
                "Investigate the regression.",
            },
          ],
          requirementCoverage: [],
          requiresHumanInput: false,
          confidence: 0.8,
        }),
      ).toThrow();
    });
  });