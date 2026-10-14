import { describe, expect, it } from "vitest";

import type {
  CommandResult,
  CommandRunner,
} from "./command-runner.js";
import {
  DeterministicValidator,
} from "./validator.js";

class FakeCommandRunner implements CommandRunner {
  private callIndex = 0;

  constructor(
    private readonly results: CommandResult[],
  ) {}

  async run(
    _command: string,
    _args: string[],
    _cwd: string,
  ): Promise<CommandResult> {
    const result = this.results[this.callIndex];

    this.callIndex += 1;

    if (!result) {
      throw new Error(
        "FakeCommandRunner has no result for this call.",
      );
    }

    return result;
  }
}

function createCommandResult(
  command: string,
  args: string[],
  exitCode: number,
): CommandResult {
  return {
    command,
    args,
    exitCode,
    stdout:
      exitCode === 0
        ? "Command completed successfully."
        : "",
    stderr:
      exitCode === 0
        ? ""
        : "Command failed.",
    durationMs: 100,
  };
}

describe("DeterministicValidator", () => {
  it("passes when every validation check succeeds", async () => {
    const runner = new FakeCommandRunner([
      createCommandResult(
        "flutter",
        ["analyze"],
        0,
      ),
      createCommandResult(
        "flutter",
        ["test"],
        0,
      ),
    ]);

    const validator = new DeterministicValidator(
      runner,
      [
        {
          name: "Flutter analyze",
          command: "flutter",
          args: ["analyze"],
        },
        {
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
        },
      ],
    );

    const result = await validator.validate(
      "/fake/worktree",
    );

    expect(result.passed).toBe(true);
    expect(result.failedChecks).toEqual([]);
    expect(result.checks).toHaveLength(2);

    expect(
      result.checks.every(
        (check) => check.passed,
      ),
    ).toBe(true);
  });

  it("fails when any validation check fails", async () => {
    const runner = new FakeCommandRunner([
      createCommandResult(
        "flutter",
        ["analyze"],
        0,
      ),
      createCommandResult(
        "flutter",
        ["test"],
        1,
      ),
    ]);

    const validator = new DeterministicValidator(
      runner,
      [
        {
          name: "Flutter analyze",
          command: "flutter",
          args: ["analyze"],
        },
        {
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
        },
      ],
    );

    const result = await validator.validate(
      "/fake/worktree",
    );

    expect(result.passed).toBe(false);

    expect(result.failedChecks).toEqual([
      "Flutter tests",
    ]);

    expect(result.checks[0]?.passed).toBe(
      true,
    );

    expect(result.checks[1]?.passed).toBe(
      false,
    );
  });

  it("preserves validation evidence from the command runner", async () => {
    const runner = new FakeCommandRunner([
      {
        command: "flutter",
        args: ["test"],
        exitCode: 1,
        stdout: "Some tests passed.",
        stderr: "One test failed.",
        durationMs: 250,
      },
    ]);

    const validator = new DeterministicValidator(
      runner,
      [
        {
          name: "Flutter tests",
          command: "flutter",
          args: ["test"],
        },
      ],
    );

    const result = await validator.validate(
      "/fake/worktree",
    );

    expect(result.checks[0]).toMatchObject({
      name: "Flutter tests",
      command: "flutter",
      args: ["test"],
      exitCode: 1,
      stdout: "Some tests passed.",
      stderr: "One test failed.",
      durationMs: 250,
      passed: false,
    });
  });
});