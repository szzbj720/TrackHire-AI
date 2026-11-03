import { z } from "zod";

import type {
  ModelProvider,
} from "../models/provider.js";
import type {
  EngineeringTask,
} from "../schemas/task.js";
import {
  verificationProbeSchema,
  type VerificationProbe,
} from "../schemas/verification.js";

const verificationPlanSchema =
  z.object({
    probes:
      z.array(
        verificationProbeSchema,
      ).min(1),
  });

const verificationResponseSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    probes: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1 },
          hypothesis: { type: "string", minLength: 1 },
          rationale: { type: "string", minLength: 1 },
          command: { type: "string", enum: ["flutter"] },
          args: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          expectedOutcome: { type: "string", minLength: 1 },
          requirement: { type: "string" },
        },
        required: [
          "id",
          "hypothesis",
          "rationale",
          "command",
          "args",
          "expectedOutcome",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["probes"],
  additionalProperties: false,
};

export interface VerificationPlannerInput {
  task: EngineeringTask;
  changedFiles: Array<{
    path: string;
    content: string;
  }>;
}

export interface VerificationPlan {
  probes: VerificationProbe[];
}

export interface VerificationPlanner {
  plan(
    input: VerificationPlannerInput,
  ): Promise<VerificationPlan>;
}

export class ModelVerificationPlanner
  implements VerificationPlanner
{
  constructor(
    private readonly provider:
      ModelProvider,
  ) {}

  async plan(
    input: VerificationPlannerInput,
  ): Promise<VerificationPlan> {
    const response =
      await this.provider.generate({
        systemPrompt: [
          "You are an independent software verification engineer.",
          "Your job is to actively look for ways an implementation could be wrong even when deterministic validation already passes.",
          "Generate 1 to 4 targeted executable verification probes.",
          "Each probe must be an object with id, hypothesis, rationale, command, args, and expectedOutcome.",
          "Use command flutter and args starting with test, for example [\"test\", \"test/application_provider_test.dart\"].",
          "Do not use shell commands, scripts, or paths outside the repository.",
          "Never invent test filenames. Use flutter test with no file argument when the available test list is unknown.",
          "Focus on requirement gaps, edge cases, regressions, state inconsistencies, persistence failures, API mismatches, and cross-file inconsistencies that are relevant to the supplied task and changed files.",
          "Each probe must test a concrete failure hypothesis.",
          "Do not modify the implementation.",
          "Do not invent unrelated requirements.",
          "Prefer focused probes over rerunning broad validation commands.",
          "Return only valid JSON with a probes array matching the requested structure.",
        ].join(" "),
        userPrompt: JSON.stringify({
          task: {
            request:
              input.task.request,
            requirements:
              input.task.requirements,
            acceptanceCriteria:
              input.task
                .acceptanceCriteria,
            constraints:
              input.task.constraints,
          },
          changedFiles:
            input.changedFiles,
        }),
        responseSchema: verificationResponseSchema,
      });

    const parsed: unknown =
      JSON.parse(response.content);

    return verificationPlanSchema.parse(
      parsed,
    );
  }
}
