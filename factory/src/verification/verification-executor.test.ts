import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CommandRunner,
} from "../validation/command-runner.js";
import type {
  VerificationProbe,
} from "../schemas/verification.js";
import {
  VerificationExecutor,
} from "./verification-executor.js";

class FakeCommandRunner
  implements CommandRunner
{
  constructor(
    private readonly exitCodes:
      number[],
  ) {}

  async run(
    command: string,
    args: string[],
    _cwd: string,
  ) {
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
      "executes every probe and collects evidence",
      async () => {
        const executor =
          new VerificationExecutor(
            new FakeCommandRunner([
              0,
              0,
            ]),
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
  },
);
