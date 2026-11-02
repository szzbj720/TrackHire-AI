import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  VerificationProbe,
} from "../schemas/verification.js";
import type {
  CommandRunner,
} from "../validation/command-runner.js";
import {
  VerificationExecutor,
} from "./verification-executor.js";
import {
  AllowlistedVerificationProbePolicy,
} from "./verification-probe-policy.js";

class FakeCommandRunner
  implements CommandRunner
{
  calls = 0;

  constructor(
    private readonly exitCodes:
      number[],
  ) {}

  async run(
    command: string,
    args: string[],
    _cwd: string,
  ) {
    this.calls += 1;

    const exitCode =
      this.exitCodes.shift() ?? 0;

    return {
      command,
      args,
      exitCode,
      stdout:
        exitCode === 0
          ? "probe passed"
          : "",
      stderr:
        exitCode === 0
          ? ""
          : "probe failed",
      durationMs: 10,
    };
  }
}

const probes: VerificationProbe[] = [
  {
    id: "probe-one",
    hypothesis:
      "The changed behavior may fail for an edge case.",
    rationale:
      "The implementation touches validation logic.",
    command: "flutter",
    args: [
      "test",
      "test/probe_one_test.dart",
    ],
    expectedOutcome:
      "The edge case is handled correctly.",
  },
  {
    id: "probe-two",
    hypothesis:
      "Existing behavior may have regressed.",
    rationale:
      "The implementation changes shared code.",
    command: "flutter",
    args: [
      "test",
      "test/probe_two_test.dart",
    ],
    expectedOutcome:
      "Existing behavior remains unchanged.",
  },
];

describe(
  "VerificationExecutor",
  () => {
    it(
      "executes every allowed probe and collects evidence",
      async () => {
        const executor =
          new VerificationExecutor(
            new FakeCommandRunner([
              0,
              0,
            ]),
            new AllowlistedVerificationProbePolicy(),
          );

        const result =
          await executor.execute(
            probes,
            "/tmp/worktree",
          );

        expect(result.passed).toBe(
          true,
        );

        expect(
          result.probes,
        ).toHaveLength(2);

        expect(
          result.failedProbes,
        ).toEqual([]);
      },
    );

    it(
      "records failed probes",
      async () => {
        const executor =
          new VerificationExecutor(
            new FakeCommandRunner([
              0,
              1,
            ]),
            new AllowlistedVerificationProbePolicy(),
          );

        const result =
          await executor.execute(
            probes,
            "/tmp/worktree",
          );

        expect(result.passed).toBe(
          false,
        );

        expect(
          result.failedProbes,
        ).toEqual([
          "probe-two",
        ]);

        expect(
          result.probes[1]?.passed,
        ).toBe(false);
      },
    );

    it(
      "rejects an empty probe set",
      async () => {
        const executor =
          new VerificationExecutor(
            new FakeCommandRunner([]),
            new AllowlistedVerificationProbePolicy(),
          );

        await expect(
          executor.execute(
            [],
            "/tmp/worktree",
          ),
        ).rejects.toThrow(
          "At least one verification probe is required.",
        );
      },
    );

    it(
      "rejects a disallowed probe before executing any probes",
      async () => {
        const runner =
          new FakeCommandRunner([0]);

        const executor =
          new VerificationExecutor(
            runner,
            new AllowlistedVerificationProbePolicy(),
          );

        const unsafeProbe:
          VerificationProbe = {
          id: "unsafe-probe",
          hypothesis:
            "A destructive command could be executed.",
          rationale:
            "Model-generated commands must be constrained.",
          command: "rm",
          args: ["-rf", "."],
          expectedOutcome:
            "The command is rejected.",
        };

        await expect(
          executor.execute(
            [unsafeProbe],
            "/tmp/worktree",
          ),
        ).rejects.toThrow(
          'Verification probe "unsafe-probe" uses disallowed command "rm".',
        );

        expect(
          runner.calls,
        ).toBe(0);
      },
    );
  },
);
