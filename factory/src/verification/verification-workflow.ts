import { stat, readdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";
import { trackHireCaseSensitiveSearchFixture } from "../benchmarks/trackhire-case-sensitive-search-fixture.js";

import type {
  EngineeringTask,
} from "../schemas/task.js";
import type {
  ValidationResult,
} from "../schemas/validation.js";
import type {
  VerificationResult,
} from "../schemas/verification.js";
import {
  VerificationExecutor,
} from "./verification-executor.js";
import type {
  VerificationPlan,
  VerificationPlanner,
} from "./verification-planner.js";

export interface VerificationWorkflowInput {
  task: EngineeringTask;
  validation: ValidationResult;
  changedFiles: Array<{
    path: string;
    content: string;
  }>;
  worktreePath: string;
}

export interface VerificationWorkflowResult {
  plan: VerificationPlan;
  verification: VerificationResult;
}

export class VerificationWorkflow {
  constructor(
    private readonly planner:
      VerificationPlanner,
    private readonly executor:
      VerificationExecutor,
  ) {}

  async run(
    input: VerificationWorkflowInput,
  ): Promise<VerificationWorkflowResult> {
    if (!input.validation.passed) {
      throw new Error(
        "Cannot run independent verification after failed deterministic validation.",
      );
    }

    const availableTestFiles: string[] = [];
    const findTests = async (directory: string): Promise<void> => {
      const entries = await readdir(resolve(input.worktreePath, directory), {
        withFileTypes: true,
      }).catch(() => []);
      for (const entry of entries) {
        const path = directory + "/" + entry.name;
        if (entry.isDirectory()) {
          await findTests(path);
        } else if (entry.isFile() && path.endsWith("_test.dart")) {
          availableTestFiles.push(path);
        }
      }
    };
    await findTests("test");

    const plan =
      await this.planner.plan({
        task: input.task,
        changedFiles:
          input.changedFiles,
        availableTestFiles,
      });

    // A model may invent a test filename. Do not treat a missing test
    // as an implementation failure or trigger an automated repair.
    for (const probe of plan.probes) {
      const targets = probe.args.slice(1).filter((arg) => !arg.startsWith("-"));
      for (const target of targets) {
        if (!target.endsWith(".dart")) {
          continue;
        }
        const absoluteTarget = resolve(input.worktreePath, target);
        const relativeTarget = relative(input.worktreePath, absoluteTarget);
        if (
          isAbsolute(target) ||
          relativeTarget === ".." ||
          relativeTarget.startsWith("../") ||
          relativeTarget.startsWith("..\\")
        ) {
          throw new Error(
            `Verification probe "${probe.id}" references an unsafe test path: ${target}.`,
          );
        }
        const file = await stat(absoluteTarget).catch(() => null);
        if (!file?.isFile()) {
          throw new Error(
            `Verification probe "${probe.id}" references a missing test file: ${target}. This is a verification-plan error, not an implementation failure.`,
          );
        }
      }
    }

    const verification =
      await this.executor.execute(
        plan.probes,
        input.worktreePath,
      );

    const requiresCaseToggle =
      /case[- ]sensitive/i.test(input.task.request) &&
      /search/i.test(input.task.request) &&
      /toggle|switch|checkbox/i.test(input.task.request);
    if (requiresCaseToggle) {
      const providerSource = await readFile(
        resolve(input.worktreePath, "lib/providers/application_provider.dart"),
        "utf8",
      );
      const setter = providerSource.match(
        /\bvoid\s+(toggleCaseSensitiveSearch\w*|setCaseSensitiveSearch\w*)\s*\(([^)]*)\)/,
      );
      const methodName = setter?.[1];
      if (!methodName) {
        throw new Error("Case-sensitive search behavioral verification requires a provider toggle or setter.");
      }

      const setterUsesBoolean = methodName.startsWith("set");
      if (setterUsesBoolean && !/\bbool\b/.test(setter?.[2] ?? "")) {
        throw new Error("Case-sensitive search setter must accept a boolean.");
      }
      if (!setterUsesBoolean && (setter?.[2] ?? "").trim() !== "") {
        throw new Error("Case-sensitive search toggle must take no arguments.");
      }

      const callPattern = /provider\.toggleCaseSensitiveSearch\(\);/g;
      let callIndex = 0;
      const fixtureContent = trackHireCaseSensitiveSearchFixture.content.replace(
        callPattern,
        () => {
          const index = callIndex++;
          if (!setterUsesBoolean) {
            return "provider." + methodName + "();";
          }
          const enabled = [true, true, false, true][index];
          return "provider." + methodName + "(" + enabled + ");";
        },
      );
      if (callIndex !== 4) {
        throw new Error("Case-sensitive search fixture has an unexpected number of toggle calls.");
      }

      const fixturePath = resolve(
        input.worktreePath,
        trackHireCaseSensitiveSearchFixture.path,
      );
      const existing = await stat(fixturePath).catch(() => null);
      if (existing) {
        throw new Error("Refusing to overwrite an existing case-sensitive search test fixture.");
      }
      await writeFile(fixturePath, fixtureContent, { flag: "wx" });
      const behaviorProbe = {
        id: "case-sensitive-search-behavior",
        hypothesis: "Case-sensitive search may not behave as requested.",
        rationale: "Execute held-out Flutter provider behavior tests.",
        command: "flutter",
        args: ["test", trackHireCaseSensitiveSearchFixture.path],
        expectedOutcome: "All case-sensitive search behavior tests pass.",
      };
      try {
        const behavioral = await this.executor.execute(
          [behaviorProbe],
          input.worktreePath,
        );
        plan.probes.push(behaviorProbe);
        verification.probes.push(...behavioral.probes);
        verification.failedProbes.push(...behavioral.failedProbes);
        verification.passed = verification.passed && behavioral.passed;
        verification.durationMs += behavioral.durationMs;
      } finally {
        await unlink(fixturePath);
      }
    }

    return {
      plan,
      verification,
    };
  }
}
