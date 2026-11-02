import type {
  VerificationProbe,
} from "../schemas/verification.js";

export interface VerificationProbePolicy {
  assertAllowed(
    probe: VerificationProbe,
  ): void;
}

export class AllowlistedVerificationProbePolicy
  implements VerificationProbePolicy
{
  assertAllowed(
    probe: VerificationProbe,
  ): void {
    if (probe.command !== "flutter") {
      throw new Error(
        `Verification probe "${probe.id}" uses disallowed command "${probe.command}".`,
      );
    }

    if (
      probe.args.length === 0 ||
      probe.args[0] !== "test"
    ) {
      throw new Error(
        `Verification probe "${probe.id}" may only run flutter test.`,
      );
    }

    if (
      probe.args.some(
        (arg) =>
          arg.includes("..") ||
          arg.startsWith("/") ||
          arg.startsWith("~"),
      )
    ) {
      throw new Error(
        `Verification probe "${probe.id}" contains a disallowed path argument.`,
      );
    }
  }
}
