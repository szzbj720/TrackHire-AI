import {
  describe,
  expect,
  it,
} from "vitest";

import {
  trustDecisionSchema,
} from "./trust-decision.js";

describe(
  "trustDecisionSchema",
  () => {
    it(
      "accepts an evidence-backed merge decision",
      () => {
        const result =
          trustDecisionSchema.parse({
            action: "MERGE",
            confidence: 0.92,
            reasons: [
              "Validation and verification passed.",
            ],
            evidence: [
              {
                source:
                  "validation",
                signal:
                  "Deterministic validation passed.",
                supportsTrust: true,
              },
              {
                source:
                  "verification",
                signal:
                  "Independent verification passed.",
                supportsTrust: true,
              },
            ],
          });

        expect(result.action).toBe(
          "MERGE",
        );
      },
    );

    it(
      "accepts retry and escalation decisions",
      () => {
        for (
          const action of [
            "RETRY",
            "ESCALATE",
          ] as const
        ) {
          expect(() =>
            trustDecisionSchema.parse({
              action,
              confidence: 0.4,
              reasons: [
                "Negative evidence requires intervention.",
              ],
              evidence: [
                {
                  source:
                    "verification",
                  signal:
                    "A targeted probe failed.",
                  supportsTrust: false,
                },
              ],
            }),
          ).not.toThrow();
        }
      },
    );

    it(
      "rejects confidence outside the valid range",
      () => {
        expect(() =>
          trustDecisionSchema.parse({
            action: "MERGE",
            confidence: 1.2,
            reasons: [
              "Invalid confidence.",
            ],
            evidence: [
              {
                source: "review",
                signal:
                  "Review approved.",
                supportsTrust: true,
              },
            ],
          }),
        ).toThrow();
      },
    );

    it(
      "requires concrete evidence",
      () => {
        expect(() =>
          trustDecisionSchema.parse({
            action: "ESCALATE",
            confidence: 0.2,
            reasons: [
              "Evidence is insufficient.",
            ],
            evidence: [],
          }),
        ).toThrow();
      },
    );
  },
);
