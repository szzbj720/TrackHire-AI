import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    OllamaProvider,
    type OllamaFetch,
  } from "./ollama-provider.js";
  
  describe(
    "OllamaProvider",
    () => {
      it(
        "sends a deterministic local generation request",
        async () => {
          let requestedUrl = "";
          let requestedBody = "";
  
          const fetchMock:
            OllamaFetch =
            async (
              input,
              init,
            ) => {
              requestedUrl =
                input;
  
              requestedBody =
                init?.body ?? "";
  
              return {
                ok:
                  true,
  
                status:
                  200,
  
                async json() {
                  return {
                    model:
                      "qwen2.5-coder:7b",
  
                    response:
                      "{\"approved\":true}",
  
                    prompt_eval_count:
                      25,
  
                    eval_count:
                      10,
                  };
                },
              };
            };
  
          const provider =
            new OllamaProvider({
              fetch:
                fetchMock,
            });
  
          const result =
            await provider.generate({
              systemPrompt:
                "Return JSON.",
  
              userPrompt:
                "Review this change.",
            });
  
          expect(
            requestedUrl,
          ).toBe(
            "http://127.0.0.1:11434/api/generate",
          );
  
          expect(
            JSON.parse(
              requestedBody,
            ),
          ).toEqual({
            model:
              "qwen2.5-coder:7b",
  
            system:
              "Return JSON.",
  
            prompt:
              "Review this change.",
  
            stream:
              false,
  
            format:
              "json",
  
            options: {
              temperature:
                0,
            },
          });
  
          expect(
            result,
          ).toEqual({
            content:
              "{\"approved\":true}",
  
            model:
              "qwen2.5-coder:7b",
  
            usage: {
              inputTokens:
                25,
  
              outputTokens:
                10,
  
              estimatedCostUsd:
                0,
            },
          });
        },
      );
  
      it(
        "passes a structured output schema to Ollama",
        async () => {
          let requestedBody = "";
  
          const fetchMock:
            OllamaFetch =
            async (
              _input,
              init,
            ) => {
              requestedBody =
                init?.body ?? "";
  
              return {
                ok:
                  true,
  
                status:
                  200,
  
                async json() {
                  return {
                    model:
                      "qwen2.5-coder:7b",
  
                    response:
                      "{\"value\":true}",
                  };
                },
              };
            };
  
          const provider =
            new OllamaProvider({
              fetch:
                fetchMock,
            });
  
          const responseSchema = {
            type:
              "object",
  
            properties: {
              value: {
                type:
                  "boolean",
              },
            },
  
            required: [
              "value",
            ],
  
            additionalProperties:
              false,
          };
  
          await provider.generate({
            systemPrompt:
              "Return structured JSON.",
  
            userPrompt:
              "Return true.",
  
            responseSchema,
          });
  
          const parsedBody =
            JSON.parse(
              requestedBody,
            );
  
          expect(
            parsedBody.format,
          ).toEqual(
            responseSchema,
          );
        },
      );
  
      it(
        "allows the model and base URL to be configured",
        async () => {
          let requestedUrl = "";
  
          const fetchMock:
            OllamaFetch =
            async (
              input,
            ) => {
              requestedUrl =
                input;
  
              return {
                ok:
                  true,
  
                status:
                  200,
  
                async json() {
                  return {
                    model:
                      "custom-model",
  
                    response:
                      "{}",
                  };
                },
              };
            };
  
          const provider =
            new OllamaProvider({
              model:
                "custom-model",
  
              baseUrl:
                "http://localhost:9999/",
  
              fetch:
                fetchMock,
            });
  
          await provider.generate({
            systemPrompt:
              "system",
  
            userPrompt:
              "user",
          });
  
          expect(
            requestedUrl,
          ).toBe(
            "http://localhost:9999/api/generate",
          );
        },
      );
  
      it(
        "reports Ollama HTTP failures",
        async () => {
          const fetchMock:
            OllamaFetch =
            async () => ({
              ok:
                false,
  
              status:
                500,
  
              async json() {
                return {};
              },
            });
  
          const provider =
            new OllamaProvider({
              fetch:
                fetchMock,
            });
  
          await expect(
            provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            }),
          ).rejects.toThrow(
            "Ollama request failed with status 500.",
          );
        },
      );
  
      it(
        "rejects malformed Ollama responses",
        async () => {
          const fetchMock:
            OllamaFetch =
            async () => ({
              ok:
                true,
  
              status:
                200,
  
              async json() {
                return {
                  unexpected:
                    true,
                };
              },
            });
  
          const provider =
            new OllamaProvider({
              fetch:
                fetchMock,
            });
  
          await expect(
            provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            }),
          ).rejects.toThrow(
            "Ollama response is missing model or response content.",
          );
        },
      );
  
      it(
        "reports zero estimated API cost",
        async () => {
          const fetchMock:
            OllamaFetch =
            async () => ({
              ok:
                true,
  
              status:
                200,
  
              async json() {
                return {
                  model:
                    "qwen2.5-coder:7b",
  
                  response:
                    "{}",
                };
              },
            });
  
          const provider =
            new OllamaProvider({
              fetch:
                fetchMock,
            });
  
          const result =
            await provider.generate({
              systemPrompt:
                "system",
  
              userPrompt:
                "user",
            });
  
          expect(
            result.usage,
          ).toEqual({
            estimatedCostUsd:
              0,
          });
        },
      );
    },
  );