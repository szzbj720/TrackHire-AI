import type {
    ModelProfile,
    ModelProviderId,
  } from "../models/model-profile.js";
  
  import type {
    ModelProvider,
  } from "../models/provider.js";
  
  import type {
    ModelRegistry,
  } from "../models/model-registry.js";
  
  import {
    createBenchmarkModelStack,
  } from "./benchmark-model-stack.js";
  
  import type {
    BenchmarkModelStack,
  } from "./benchmark-model-stack.js";
  
  export interface BenchmarkProviderFactoryInput {
    profile:
      ModelProfile;
  }
  
  export type BenchmarkProviderFactory =
    (
      input:
        BenchmarkProviderFactoryInput,
    ) => ModelProvider;
  
  export interface BenchmarkProviderRegistryOptions {
    modelRegistry:
      ModelRegistry;
  
    providerFactories:
      Partial<
        Record<
          ModelProviderId,
          BenchmarkProviderFactory
        >
      >;
  }
  
  export class BenchmarkProviderRegistry {
    constructor(
      private readonly options:
        BenchmarkProviderRegistryOptions,
    ) {}
  
    createStack(
      profileId: string,
    ): BenchmarkModelStack {
      const profile =
        this.options
          .modelRegistry
          .get(
            profileId,
          );
  
      if (
        !profile.capabilities.includes(
          "implementation",
        )
      ) {
        throw new Error(
          `Model profile does not support implementation: ${profile.id}`,
        );
      }
  
      const factory =
        this.options
          .providerFactories[
            profile.provider
          ];
  
      if (!factory) {
        throw new Error(
          `No benchmark provider factory registered for provider: ${profile.provider}`,
        );
      }
  
      const provider =
        factory({
          profile,
        });
  
      return createBenchmarkModelStack(
        provider,
      );
    }
  }