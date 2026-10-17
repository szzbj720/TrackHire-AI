import {
    ModelBuilder,
  } from "../agents/builder.js";
  
  import type {
    ModelProvider,
  } from "../models/provider.js";
  
  import {
    BenchmarkModelProvider,
  } from "./benchmark-model-provider.js";
  
  export interface BenchmarkModelStack {
    provider:
      BenchmarkModelProvider;
  
    builder:
      ModelBuilder;
  }
  
  export function createBenchmarkModelStack(
    provider: ModelProvider,
  ): BenchmarkModelStack {
    const benchmarkProvider =
      new BenchmarkModelProvider(
        provider,
      );
  
    const builder =
      new ModelBuilder(
        benchmarkProvider,
      );
  
    return {
      provider:
        benchmarkProvider,
  
      builder,
    };
  }