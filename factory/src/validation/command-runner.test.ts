import { describe, expect, it } from "vitest";

import { ProcessCommandRunner } from "./command-runner.js";

describe("ProcessCommandRunner", () => {
  it("captures stdout from a successful command", async () => {
    const runner = new ProcessCommandRunner();

    const result = await runner.run(
      process.execPath,
      ["-e", "console.log('hello factory')"],
      process.cwd(),
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(
      "hello factory",
    );
    expect(result.stderr).toBe("");
    expect(result.durationMs).toBeGreaterThanOrEqual(
      0,
    );
  });

  it("captures stderr and a non-zero exit code", async () => {
    const runner = new ProcessCommandRunner();

    const result = await runner.run(
      process.execPath,
      [
        "-e",
        "console.error('validation failed'); process.exit(2)",
      ],
      process.cwd(),
    );

    expect(result.exitCode).toBe(2);
    expect(result.stderr.trim()).toBe(
      "validation failed",
    );
  });

  it("keeps command arguments separate from the shell", async () => {
    const runner = new ProcessCommandRunner();

    const value = "hello && echo unsafe";

    const result = await runner.run(
      process.execPath,
      [
        "-e",
        "console.log(process.argv[1])",
        value,
      ],
      process.cwd(),
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(value);
  });
});