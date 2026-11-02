import type {
  VerificationProbe,
  VerificationProbeResult,
  VerificationResult,
} from "../schemas/verification.js";
import type {
  CommandRunner,
} from "../validation/command-runner.js";
import type {
  VerificationProbePolicy,
} from "./verification-probe-policy.js";

export class VerificationExecutor {
  constructor(
    private readonly runner: CommandRunner,
    private readonly policy: VerificationProbePolicy,
  ) {}

  async execute(
    probes: VerificationProbe[],
    worktreePath: string,
  ): Promise<VerificationResult> {
    if (probes.length === 0) {
      throw new Error(
        "At least one verification probe is required.",
      );
    }

    for (const probe of probes) {
      this.policy.assertAllowed(probe);
    }

    const startedAt = Date.now();

    const results:
      VerificationProbeResult[] = [];

    for (const probe of probes) {
      const commandResult =
        await this.runner.run(
          probe.command,
          probe.args,
          worktreePath,
        );

      results.push({
        probeId: probe.id,
        command:
          commandResult.command,
        args: commandResult.args,
        exitCode:
          commandResult.exitCode,
        stdout:
          commandResult.stdout,
        stderr:
          commandResult.stderr,
        durationMs:
          commandResult.durationMs,
        passed:
          commandResult.exitCode === 0,
      });
    }

    const failedProbes =
      results
        .filter(
          (result) =>
            !result.passed,
        )
        .map(
          (result) =>
            result.probeId,
        );

    return {
      passed:
        failedProbes.length === 0,
      probes: results,
      failedProbes,
      durationMs:
        Date.now() - startedAt,
    };
  }
}
