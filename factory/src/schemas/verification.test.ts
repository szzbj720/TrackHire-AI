import {
  describe,
  expect,
  it,
} from "vitest";

import {
  verificationProbeSchema,
  verificationResultSchema,
} from "./verification.js";

describe(
  "verification schemas",
  () => {
    it(
      "accepts a targeted verification probe",
      () => {
        const probe =
          verificationProbeSchema.parse({
            id: "whitespace-company",
            hypothesis:
              "Whitespace-only company names may still be accepted.",
            rationale:
              "The implementation changed required-field validation.",
            command: "flutter",
            args: [
              "test",
              "test/whitespace_company_test.dart",
            ],
            expectedOutcome:
              "The whitespace-only submission is rejected.",
            requirement:
              "Reject whitespace-only required fields.",
          });

        expect(probe.id).toBe(
          "whitespace-company",
        );
      },
    );

    it(
      "requires a concrete hypothesis",
      () => {
        expect(() =>
          verificationProbeSchema.parse({
            id: "probe",
            hypothesis: "",
            rationale: "Check behavior.",
            command: "flutter",
            args: ["test"],
            expectedOutcome:
              "Tests pass.",
          }),
        ).toThrow();
      },
    );

    it(
      "accepts verification evidence",
      () => {
        const result =
          verificationResultSchema.parse({
            passed: false,
            probes: [
              {
                probeId:
                  "whitespace-company",
                command: "flutter",
                args: [
                  "test",
                  "test/whitespace_company_test.dart",
                ],
                exitCode: 1,
                stdout: "",
                stderr:
                  "Expected validation error.",
                durationMs: 120,
                passed: false,
              },
            ],
            failedProbes: [
              "whitespace-company",
            ],
            durationMs: 120,
          });

        expect(result.passed).toBe(
          false,
        );

        expect(
          result.failedProbes,
        ).toEqual([
          "whitespace-company",
        ]);
      },
    );

    it(
      "rejects an empty probe result set",
      () => {
        expect(() =>
          verificationResultSchema.parse({
            passed: true,
            probes: [],
            failedProbes: [],
            durationMs: 0,
          }),
        ).toThrow();
      },
    );
  },
);
