import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AnthropicClient,
  } from "../models/anthropic-provider.js";
  
  import {
    AnthropicProvider,
  } from "../models/anthropic-provider.js";
  
  import {
    ModelRegistry,
  } from "../models/model-registry.js";
  
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  
  import {
    BenchmarkProviderRegistry,
  } from "./benchmark-provider-registry.js";
  
  class FakeOpenAIProvider
    implements ModelProvider {
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return {
        content:
          JSON.stringify({
            summary:
              "OpenAI implementation.",
  
            writes: [],
  
            assumptions: [],
  
            warnings: [],
  
            requiresHumanInput:
              false,
          }),
  
        model:
          "openai-test-model",
  
        usage: {
          inputTokens: 500,
          outputTokens: 150,
          estimatedCostUsd: 0,
        },
      };
    }
  }
  
  function createAnthropicClient():
    AnthropicClient {
    return {
      messages: {
        async create() {
          return {
            model:
              "claude-test-model",
  
            content: [
              {
                type: "text",
  
                text:
                  JSON.stringify({
                    summary:
                      "Claude implementation.",
  
                    writes: [],
  
                    assumptions: [],
  
                    warnings: [],
  
                    requiresHumanInput:
                      false,
                  }),
              },
            ],
  
            usage: {
              input_tokens: 480,
              output_tokens: 170,
            },
          };
        },
      },
    };
  }
  
  describe(
    "cross-provider benchmark evidence",
    () => {
      it(
        "records OpenAI and Anthropic usage through the same benchmark contract",
        async () => {
          const modelRegistry =
            new ModelRegistry([
              {
                id:
                  "openai-implementation",
  
                provider:
                  "openai",
  
                model:
                  "openai-test-model",
  
                capabilities: [
                  "implementation",
                ],
              },
  
              {
                id:
                  "claude-implementation",
  
                provider:
                  "anthropic",
  
                model:
                  "claude-test-model",
  
                capabilities: [
                  "implementation",
                ],
              },
            ]);
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {
                openai:
                  () =>
                    new FakeOpenAIProvider(),
  
                anthropic:
                  ({ profile }) =>
                    new AnthropicProvider({
                      client:
                        createAnthropicClient(),
  
                      model:
                        profile.model,
                    }),
              },
            });
  
          const openAIStack =
            providerRegistry.createStack(
              "openai-implementation",
            );
  
          const claudeStack =
            providerRegistry.createStack(
              "claude-implementation",
            );
  
          const request = {
            systemPrompt:
              "Implement the approved plan.",
  
            userPrompt:
              "Benchmark task.",
          };
  
          await openAIStack
            .provider
            .generate(
              request,
            );
  
          await claudeStack
            .provider
            .generate(
              request,
            );
  
          const openAIEvidence =
            openAIStack
              .provider
              .snapshot();
  
          const claudeEvidence =
            claudeStack
              .provider
              .snapshot();
  
          expect(
            openAIEvidence,
          ).toMatchObject({
            successfulCalls: 1,
            failedCalls: 0,
            inputTokens: 500,
            outputTokens: 150,
            estimatedCostUsd: 0,
          });
  
          expect(
            claudeEvidence,
          ).toMatchObject({
            successfulCalls: 1,
            failedCalls: 0,
            inputTokens: 480,
            outputTokens: 170,
            estimatedCostUsd: 0,
          });
  
          expect(
            openAIEvidence
              .calls[0]
              ?.model,
          ).toBe(
            "openai-test-model",
          );
  
          expect(
            claudeEvidence
              .calls[0]
              ?.model,
          ).toBe(
            "claude-test-model",
          );
  
          expect(
            typeof openAIEvidence
              .totalDurationMs,
          ).toBe(
            "number",
          );
  
          expect(
            typeof claudeEvidence
              .totalDurationMs,
          ).toBe(
            "number",
          );
        },
      );
  
      it(
        "keeps provider measurements isolated between benchmark stacks",
        async () => {
          const modelRegistry =
            new ModelRegistry([
              {
                id:
                  "openai-implementation",
  
                provider:
                  "openai",
  
                model:
                  "openai-test-model",
  
                capabilities: [
                  "implementation",
                ],
              },
  
              {
                id:
                  "claude-implementation",
  
                provider:
                  "anthropic",
  
                model:
                  "claude-test-model",
  
                capabilities: [
                  "implementation",
                ],
              },
            ]);
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {
                openai:
                  () =>
                    new FakeOpenAIProvider(),
  
                anthropic:
                  ({ profile }) =>
                    new AnthropicProvider({
                      client:
                        createAnthropicClient(),
  
                      model:
                        profile.model,
                    }),
              },
            });
  
          const openAIStack =
            providerRegistry.createStack(
              "openai-implementation",
            );
  
          const claudeStack =
            providerRegistry.createStack(
              "claude-implementation",
            );
  
          await openAIStack
            .provider
            .generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            openAIStack
              .provider
              .snapshot()
              .successfulCalls,
          ).toBe(1);
  
          expect(
            claudeStack
              .provider
              .snapshot()
              .successfulCalls,
          ).toBe(0);
  
          await claudeStack
            .provider
            .generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            openAIStack
              .provider
              .snapshot()
              .successfulCalls,
          ).toBe(1);
  
          expect(
            claudeStack
              .provider
              .snapshot()
              .successfulCalls,
          ).toBe(1);
        },
      );
    },
  );