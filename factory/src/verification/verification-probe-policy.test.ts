import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  VerificationProbe,
} from "../schemas/verification.js";
import {
  AllowlistedVerificationProbePolicy,
} from "./verification-probe-policy.js";

function createProbe(
  command = "flutter",
  args: string[] = [
    "test",
    "test/probe_test.dart",
  ],
): VerificationProbe {
  return {
    id: "probe-1",
    hypothesis:
      "A targeted regression may exist.",
    rationale:
      "The changed behavior needs independent verification.",
    command,
    args,
    expectedOutcome:
      "The targeted check passes.",
  };
}

describe(
  "AllowlistedVerificationProbePolicy",
  () => {
    it(
      "allows targeted flutter test probes",
      () => {
        const policy =
          new AllowlistedVerificationProbePolicy();

        expect(() =>
          policy.assertAllowed(
            createProbe(),
          ),
        ).not.toThrow();
      },
    );

    it(
      "rejects non-flutter commands",
      () => {
        const policy =
          new AllowlistedVerificationProbePolicy();

        expect(() =>
          policy.assertAllowed(
            createProbe(
              "rm",
              ["-rf", "."],
            ),
          ),
        ).toThrow(
          'Verification probe "probe-1" uses disallowed command "rm".',
        );
      },
    );

    it(
      "rejects flutter commands other than test",
      () => {
        const policy =
          new AllowlistedVerificationProbePolicy();

        expect(() =>
          policy.assertAllowed(
            createProbe(
              "flutter",
              ["clean"],
            ),
          ),
        ).toThrow(
          'Verification probe "probe-1" may only run flutter test.',
        );
      },
    );

    it(
      "rejects parent-directory path arguments",
      () => {
        const policy =
          new AllowlistedVerificationProbePolicy();

        expect(() =>
          policy.assertAllowed(
            createProbe(
              "flutter",
              [
                "test",
                "../outside/probe_test.dart",
              ],
            ),
          ),
        ).toThrow(
          'Verification probe "probe-1" contains a disallowed path argument.',
        );
      },
    );

    it(
      "rejects absolute path arguments",
      () => {
        const policy =
          new AllowlistedVerificationProbePolicy();

        expect(() =>
          policy.assertAllowed(
            createProbe(
              "flutter",
              [
                "test",
                "/tmp/probe_test.dart",
              ],
            ),
          ),
        ).toThrow(
          'Verification probe "probe-1" contains a disallowed path argument.',
        );
      },
    );
  },
);
