import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    CodeChangeSet,
  } from "../schemas/code-change.js";
  
  import {
    createBenchmarkModelStack,
  } from "./benchmark-model-stack.js";
  
  import {
    DeterministicCodeChangeProvider,
  } from "./deterministic-code-change-provider.js";
  
  function createChangeSet():
    CodeChangeSet {
    return {
      summary:
        "Update the approved file.",
  
      writes: [
        {
          path:
            "fixture.txt",
  
          content:
            "updated\n",
  
          summary:
            "Updated fixture.",
        },
      ],
  
      assumptions: [],
  
      warnings: [],
  
      requiresHumanInput: false,
    };
  }
  
  describe(
    "createBenchmarkModelStack",
    () => {
      it(
        "wraps a model provider with benchmark evidence collection",
        async () => {
          const sourceProvider =
            new DeterministicCodeChangeProvider({
              model:
                "deterministic-test-model",
  
              changeSet:
                createChangeSet(),
  
              inputTokens: 200,
  
              outputTokens: 75,
  
              estimatedCostUsd: 0,
            });
  
          const stack =
            createBenchmarkModelStack(
              sourceProvider,
            );
  
          await stack.provider.generate({
            systemPrompt:
              "system",
  
            userPrompt:
              "user",
          });
  
          const snapshot =
            stack.provider.snapshot();
  
          expect(
            snapshot.successfulCalls,
          ).toBe(1);
  
          expect(
            snapshot.failedCalls,
          ).toBe(0);
  
          expect(
            snapshot.inputTokens,
          ).toBe(200);
  
          expect(
            snapshot.outputTokens,
          ).toBe(75);
  
          expect(
            snapshot.estimatedCostUsd,
          ).toBe(0);
  
          expect(
            snapshot.calls[0]?.model,
          ).toBe(
            "deterministic-test-model",
          );
        },
      );
  
      it(
        "uses the same measured provider for the model builder",
        () => {
          const sourceProvider =
            new DeterministicCodeChangeProvider({
              changeSet:
                createChangeSet(),
            });
  
          const stack =
            createBenchmarkModelStack(
              sourceProvider,
            );
  
          expect(
            stack.builder,
          ).toBeInstanceOf(
            Object,
          );
  
          expect(
            stack.provider.snapshot(),
          ).toEqual({
            calls: [],
            successfulCalls: 0,
            failedCalls: 0,
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
            totalDurationMs: 0,
          });
        },
      );
    },
  );