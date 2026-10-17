import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    ModelRegistry,
  } from "../models/model-registry.js";
  
  import type {
    ModelProfile,
  } from "../models/model-profile.js";
  
  import {
    DeterministicCodeChangeProvider,
  } from "./deterministic-code-change-provider.js";
  
  import {
    BenchmarkProviderRegistry,
  } from "./benchmark-provider-registry.js";
  
  const implementationProfile:
    ModelProfile = {
      id:
        "claude-implementation",
  
      provider:
        "anthropic",
  
      model:
        "claude-test-model",
  
      capabilities: [
        "implementation",
        "review",
      ],
    };
  
  const analysisProfile:
    ModelProfile = {
      id:
        "analysis-only",
  
      provider:
        "openai",
  
      model:
        "analysis-test-model",
  
      capabilities: [
        "analysis",
        "planning",
      ],
    };
  
  describe(
    "BenchmarkProviderRegistry",
    () => {
      it(
        "creates a measured benchmark stack for the selected implementation profile",
        async () => {
          const modelRegistry =
            new ModelRegistry([
              implementationProfile,
            ]);
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {
                anthropic:
                  ({ profile }) =>
                    new DeterministicCodeChangeProvider({
                      model:
                        profile.model,
  
                      changeSet: {
                        summary:
                          "Implemented benchmark change.",
  
                        writes: [],
  
                        assumptions: [],
  
                        warnings: [],
  
                        requiresHumanInput:
                          false,
                      },
  
                      inputTokens: 600,
  
                      outputTokens: 200,
  
                      estimatedCostUsd: 0,
                    }),
              },
            });
  
          const stack =
            providerRegistry.createStack(
              "claude-implementation",
            );
  
          await stack.provider.generate({
            systemPrompt:
              "system",
  
            userPrompt:
              "user",
          });
  
          const evidence =
            stack.provider.snapshot();
  
          expect(
            evidence.successfulCalls,
          ).toBe(1);
  
          expect(
            evidence.inputTokens,
          ).toBe(600);
  
          expect(
            evidence.outputTokens,
          ).toBe(200);
  
          expect(
            evidence.calls[0]?.model,
          ).toBe(
            "claude-test-model",
          );
        },
      );
  
      it(
        "passes the selected model profile to the provider factory",
        () => {
          const modelRegistry =
            new ModelRegistry([
              implementationProfile,
            ]);
  
          let receivedProfile:
            ModelProfile | undefined;
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {
                anthropic:
                  ({ profile }) => {
                    receivedProfile =
                      profile;
  
                    return new DeterministicCodeChangeProvider({
                      changeSet: {
                        summary:
                          "No changes.",
  
                        writes: [],
  
                        assumptions: [],
  
                        warnings: [],
  
                        requiresHumanInput:
                          false,
                      },
                    });
                  },
              },
            });
  
          providerRegistry.createStack(
            "claude-implementation",
          );
  
          expect(
            receivedProfile,
          ).toEqual(
            implementationProfile,
          );
        },
      );
  
      it(
        "rejects a model that cannot perform implementation",
        () => {
          const modelRegistry =
            new ModelRegistry([
              analysisProfile,
            ]);
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {
                openai:
                  () =>
                    new DeterministicCodeChangeProvider({
                      changeSet: {
                        summary:
                          "No changes.",
  
                        writes: [],
  
                        assumptions: [],
  
                        warnings: [],
  
                        requiresHumanInput:
                          false,
                      },
                    }),
              },
            });
  
          expect(
            () =>
              providerRegistry.createStack(
                "analysis-only",
              ),
          ).toThrow(
            "Model profile does not support implementation: analysis-only",
          );
        },
      );
  
      it(
        "rejects a provider with no configured benchmark factory",
        () => {
          const modelRegistry =
            new ModelRegistry([
              implementationProfile,
            ]);
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {},
            });
  
          expect(
            () =>
              providerRegistry.createStack(
                "claude-implementation",
              ),
          ).toThrow(
            "No benchmark provider factory registered for provider: anthropic",
          );
        },
      );
  
      it(
        "rejects an unknown model profile",
        () => {
          const modelRegistry =
            new ModelRegistry();
  
          const providerRegistry =
            new BenchmarkProviderRegistry({
              modelRegistry,
  
              providerFactories: {},
            });
  
          expect(
            () =>
              providerRegistry.createStack(
                "missing-model",
              ),
          ).toThrow(
            "Unknown model profile: missing-model",
          );
        },
      );
    },
  );