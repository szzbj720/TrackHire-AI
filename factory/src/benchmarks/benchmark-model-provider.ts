import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
    ModelUsage,
  } from "../models/provider.js";
  
  export interface BenchmarkModelCall {
    callIndex: number;
  
    requestedAt: string;
    completedAt: string;
  
    durationMs: number;
  
    success: boolean;
  
    model?: string;
  
    usage: ModelUsage;
  
    error?: string;
  }
  
  export interface BenchmarkModelProviderSnapshot {
    calls: BenchmarkModelCall[];
  
    successfulCalls: number;
    failedCalls: number;
  
    inputTokens: number;
    outputTokens: number;
  
    estimatedCostUsd: number;
  
    totalDurationMs: number;
  }
  
  export interface BenchmarkClock {
    now(): number;
    isoNow(): string;
  }
  
  const defaultClock: BenchmarkClock = {
    now() {
      return Date.now();
    },
  
    isoNow() {
      return new Date().toISOString();
    },
  };
  
  function measuredUsage(
    usage:
      ModelUsage | undefined,
  ): ModelUsage {
    return {
      inputTokens:
        usage?.inputTokens ?? 0,
  
      outputTokens:
        usage?.outputTokens ?? 0,
  
      estimatedCostUsd:
        usage?.estimatedCostUsd ?? 0,
    };
  }
  
  export class BenchmarkModelProvider
    implements ModelProvider {
    private readonly calls:
      BenchmarkModelCall[] = [];
  
    constructor(
      private readonly provider:
        ModelProvider,
  
      private readonly clock:
        BenchmarkClock =
          defaultClock,
    ) {}
  
    async generate(
      request: ModelRequest,
    ): Promise<ModelResponse> {
      const callIndex =
        this.calls.length;
  
      const requestedAt =
        this.clock.isoNow();
  
      const startedAt =
        this.clock.now();
  
      try {
        const response =
          await this.provider.generate(
            request,
          );
  
        const completedAt =
          this.clock.isoNow();
  
        const durationMs =
          Math.max(
            0,
            this.clock.now() -
              startedAt,
          );
  
        this.calls.push({
          callIndex,
  
          requestedAt,
          completedAt,
  
          durationMs,
  
          success: true,
  
          model:
            response.model,
  
          usage:
            measuredUsage(
              response.usage,
            ),
        });
  
        return response;
      } catch (error: unknown) {
        const completedAt =
          this.clock.isoNow();
  
        const durationMs =
          Math.max(
            0,
            this.clock.now() -
              startedAt,
          );
  
        const message =
          error instanceof Error
            ? error.message
            : String(error);
  
        this.calls.push({
          callIndex,
  
          requestedAt,
          completedAt,
  
          durationMs,
  
          success: false,
  
          usage:
            measuredUsage(
              undefined,
            ),
  
          error:
            message,
        });
  
        throw error;
      }
    }
  
    snapshot():
      BenchmarkModelProviderSnapshot {
      const successfulCalls =
        this.calls.filter(
          (call) =>
            call.success,
        ).length;
  
      const failedCalls =
        this.calls.length -
        successfulCalls;
  
      const inputTokens =
        this.calls.reduce(
          (
            total,
            call,
          ) =>
            total +
            (call.usage
              .inputTokens ?? 0),
          0,
        );
  
      const outputTokens =
        this.calls.reduce(
          (
            total,
            call,
          ) =>
            total +
            (call.usage
              .outputTokens ?? 0),
          0,
        );
  
      const estimatedCostUsd =
        this.calls.reduce(
          (
            total,
            call,
          ) =>
            total +
            (call.usage
              .estimatedCostUsd ??
              0),
          0,
        );
  
      const totalDurationMs =
        this.calls.reduce(
          (
            total,
            call,
          ) =>
            total +
            call.durationMs,
          0,
        );
  
      return {
        calls:
          this.calls.map(
            (call) => ({
              ...call,
  
              usage: {
                ...call.usage,
              },
            }),
          ),
  
        successfulCalls,
        failedCalls,
  
        inputTokens,
        outputTokens,
  
        estimatedCostUsd,
  
        totalDurationMs,
      };
    }
  }