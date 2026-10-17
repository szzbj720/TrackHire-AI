import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    AnthropicClient,
    AnthropicMessageCreateInput,
  } from "./anthropic-provider.js";
  
  import {
    AnthropicProvider,
  } from "./anthropic-provider.js";
  
  class RecordingAnthropicClient
    implements AnthropicClient {
    requests:
      AnthropicMessageCreateInput[] =
        [];
  
    messages = {
      create:
        async (
          input:
            AnthropicMessageCreateInput,
        ) => {
          this.requests.push(
            input,
          );
  
          return {
            model:
              "claude-test-model",
  
            content: [
              {
                type:
                  "text",
  
                text:
                  "{\"summary\":",
              },
  
              {
                type:
                  "thinking",
              },
  
              {
                type:
                  "text",
  
                text:
                  "\"implemented\"}",
              },
            ],
  
            usage: {
              input_tokens:
                450,
  
              output_tokens:
                125,
            },
          };
        },
    };
  }
  
  describe(
    "AnthropicProvider",
    () => {
      it(
        "maps the factory model request to the Anthropic Messages API",
        async () => {
          const client =
            new RecordingAnthropicClient();
  
          const provider =
            new AnthropicProvider({
              client,
  
              model:
                "claude-test-model",
  
              maxTokens:
                2048,
            });
  
          await provider.generate({
            systemPrompt:
              "You are an implementation agent.",
  
            userPrompt:
              "Implement the approved plan.",
          });
  
          expect(
            client.requests,
          ).toEqual([
            {
              model:
                "claude-test-model",
  
              max_tokens:
                2048,
  
              system:
                "You are an implementation agent.",
  
              messages: [
                {
                  role:
                    "user",
  
                  content:
                    "Implement the approved plan.",
                },
              ],
            },
          ]);
        },
      );
  
      it(
        "returns text content and measured token usage through ModelProvider",
        async () => {
          const client =
            new RecordingAnthropicClient();
  
          const provider =
            new AnthropicProvider({
              client,
  
              model:
                "claude-test-model",
            });
  
          const response =
            await provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            response,
          ).toEqual({
            content:
              "{\"summary\":\"implemented\"}",
  
            model:
              "claude-test-model",
  
            usage: {
              inputTokens: 450,
              outputTokens: 125,
            },
          });
        },
      );
  
      it(
        "uses a bounded default output token limit",
        async () => {
          const client =
            new RecordingAnthropicClient();
  
          const provider =
            new AnthropicProvider({
              client,
  
              model:
                "claude-test-model",
            });
  
          await provider.generate({
            systemPrompt:
              "system",
  
            userPrompt:
              "user",
          });
  
          expect(
            client.requests[0]
              ?.max_tokens,
          ).toBe(4096);
        },
      );
  
      it(
        "ignores non-text response blocks",
        async () => {
          const client:
            AnthropicClient = {
              messages: {
                async create() {
                  return {
                    model:
                      "claude-test-model",
  
                    content: [
                      {
                        type:
                          "thinking",
                      },
  
                      {
                        type:
                          "text",
  
                        text:
                          "final",
                      },
                    ],
  
                    usage: {
                      input_tokens:
                        10,
  
                      output_tokens:
                        5,
                    },
                  };
                },
              },
            };
  
          const provider =
            new AnthropicProvider({
              client,
  
              model:
                "claude-test-model",
            });
  
          const response =
            await provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            response.content,
          ).toBe(
            "final",
          );
        },
      );
    },
  );