import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    CodeChangeSet,
  } from "../schemas/code-change.js";
  
  import {
    DeterministicCodeChangeProvider,
  } from "./deterministic-code-change-provider.js";
  
  function createChangeSet():
    CodeChangeSet {
    return {
      summary:
        "Update the application model.",
  
      writes: [
        {
          path:
            "lib/models/job_application.dart",
  
          content:
            "updated file contents",
  
          summary:
            "Added interview date support.",
        },
      ],
  
      assumptions: [
        "Interview date remains optional.",
      ],
  
      warnings: [],
  
      requiresHumanInput: false,
    };
  }
  
  describe(
    "DeterministicCodeChangeProvider",
    () => {
      it(
        "returns the configured code change set through the ModelProvider contract",
        async () => {
          const changeSet =
            createChangeSet();
  
          const provider =
            new DeterministicCodeChangeProvider({
              model:
                "deterministic-trackhire-coder",
  
              changeSet,
  
              inputTokens: 250,
  
              outputTokens: 100,
  
              estimatedCostUsd: 0,
            });
  
          const response =
            await provider.generate({
              systemPrompt:
                "Implement the approved plan.",
  
              userPrompt:
                "TrackHire benchmark task",
            });
  
          expect(
            JSON.parse(
              response.content,
            ),
          ).toEqual(
            changeSet,
          );
  
          expect(
            response.model,
          ).toBe(
            "deterministic-trackhire-coder",
          );
  
          expect(
            response.usage,
          ).toEqual({
            inputTokens: 250,
            outputTokens: 100,
            estimatedCostUsd: 0,
          });
        },
      );
  
      it(
        "records requests received from the agent",
        async () => {
          const provider =
            new DeterministicCodeChangeProvider({
              changeSet:
                createChangeSet(),
            });
  
          await provider.generate({
            systemPrompt:
              "system",
  
            userPrompt:
              "user",
          });
  
          expect(
            provider.requests,
          ).toEqual([
            {
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            },
          ]);
        },
      );
  
      it(
        "uses genuine zero usage when deterministic usage is not configured",
        async () => {
          const provider =
            new DeterministicCodeChangeProvider({
              changeSet:
                createChangeSet(),
            });
  
          const response =
            await provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            response.usage,
          ).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
          });
        },
      );
  
      it(
        "can represent a deterministic human escalation",
        async () => {
          const provider =
            new DeterministicCodeChangeProvider({
              changeSet: {
                summary:
                  "Cannot safely implement the task.",
  
                writes: [],
  
                assumptions: [],
  
                warnings: [
                  "Missing required context.",
                ],
  
                requiresHumanInput:
                  true,
              },
            });
  
          const response =
            await provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            JSON.parse(
              response.content,
            ),
          ).toEqual({
            summary:
              "Cannot safely implement the task.",
  
            writes: [],
  
            assumptions: [],
  
            warnings: [
              "Missing required context.",
            ],
  
            requiresHumanInput:
              true,
          });
        },
      );
    },
  );