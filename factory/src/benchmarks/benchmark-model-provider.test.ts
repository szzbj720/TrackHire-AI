import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  
  import {
    BenchmarkModelProvider,
    type BenchmarkClock,
  } from "./benchmark-model-provider.js";
  
  class FakeClock
    implements BenchmarkClock {
    private numberIndex = 0;
    private isoIndex = 0;
  
    constructor(
      private readonly numbers:
        number[],
  
      private readonly timestamps:
        string[],
    ) {}
  
    now(): number {
      const value =
        this.numbers[
          this.numberIndex
        ];
  
      if (
        value === undefined
      ) {
        throw new Error(
          "No fake numeric time configured.",
        );
      }
  
      this.numberIndex += 1;
  
      return value;
    }
  
    isoNow(): string {
      const value =
        this.timestamps[
          this.isoIndex
        ];
  
      if (
        value === undefined
      ) {
        throw new Error(
          "No fake timestamp configured.",
        );
      }
  
      this.isoIndex += 1;
  
      return value;
    }
  }
  
  class SuccessfulProvider
    implements ModelProvider {
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return {
        content:
          "implemented",
  
        model:
          "fake-coder",
  
        usage: {
          inputTokens: 120,
          outputTokens: 45,
          estimatedCostUsd:
            0.0125,
        },
      };
    }
  }
  
  class UsageFreeProvider
    implements ModelProvider {
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return {
        content:
          "implemented",
  
        model:
          "deterministic-coder",
      };
    }
  }
  
  class FailingProvider
    implements ModelProvider {
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      throw new Error(
        "provider unavailable",
      );
    }
  }
  
  const request:
    ModelRequest = {
      systemPrompt:
        "You are a coding agent.",
  
      userPrompt:
        "Implement the benchmark task.",
    };
  
  describe(
    "BenchmarkModelProvider",
    () => {
      it(
        "returns the wrapped provider response unchanged",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new SuccessfulProvider(),
  
              new FakeClock(
                [
                  100,
                  175,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.075Z",
                ],
              ),
            );
  
          const response =
            await provider.generate(
              request,
            );
  
          expect(
            response,
          ).toEqual({
            content:
              "implemented",
  
            model:
              "fake-coder",
  
            usage: {
              inputTokens: 120,
              outputTokens: 45,
              estimatedCostUsd:
                0.0125,
            },
          });
        },
      );
  
      it(
        "records successful model usage and latency",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new SuccessfulProvider(),
  
              new FakeClock(
                [
                  100,
                  175,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.075Z",
                ],
              ),
            );
  
          await provider.generate(
            request,
          );
  
          expect(
            provider.snapshot(),
          ).toEqual({
            calls: [
              {
                callIndex: 0,
  
                requestedAt:
                  "2026-10-17T00:00:00.000Z",
  
                completedAt:
                  "2026-10-17T00:00:00.075Z",
  
                durationMs: 75,
  
                success: true,
  
                model:
                  "fake-coder",
  
                usage: {
                  inputTokens: 120,
                  outputTokens: 45,
                  estimatedCostUsd:
                    0.0125,
                },
              },
            ],
  
            successfulCalls: 1,
            failedCalls: 0,
  
            inputTokens: 120,
            outputTokens: 45,
  
            estimatedCostUsd:
              0.0125,
  
            totalDurationMs: 75,
          });
        },
      );
  
      it(
        "uses genuine zero values when a provider reports no usage",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new UsageFreeProvider(),
  
              new FakeClock(
                [
                  10,
                  20,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.010Z",
                ],
              ),
            );
  
          await provider.generate(
            request,
          );
  
          const snapshot =
            provider.snapshot();
  
          expect(
            snapshot.inputTokens,
          ).toBe(0);
  
          expect(
            snapshot.outputTokens,
          ).toBe(0);
  
          expect(
            snapshot
              .estimatedCostUsd,
          ).toBe(0);
  
          expect(
            snapshot.calls[0]
              ?.usage,
          ).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
          });
        },
      );
  
      it(
        "records provider failures and rethrows them",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new FailingProvider(),
  
              new FakeClock(
                [
                  200,
                  260,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.060Z",
                ],
              ),
            );
  
          await expect(
            provider.generate(
              request,
            ),
          ).rejects.toThrow(
            "provider unavailable",
          );
  
          expect(
            provider.snapshot(),
          ).toEqual({
            calls: [
              {
                callIndex: 0,
  
                requestedAt:
                  "2026-10-17T00:00:00.000Z",
  
                completedAt:
                  "2026-10-17T00:00:00.060Z",
  
                durationMs: 60,
  
                success: false,
  
                usage: {
                  inputTokens: 0,
                  outputTokens: 0,
                  estimatedCostUsd: 0,
                },
  
                error:
                  "provider unavailable",
              },
            ],
  
            successfulCalls: 0,
            failedCalls: 1,
  
            inputTokens: 0,
            outputTokens: 0,
  
            estimatedCostUsd: 0,
  
            totalDurationMs: 60,
          });
        },
      );
  
      it(
        "aggregates multiple calls",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new SuccessfulProvider(),
  
              new FakeClock(
                [
                  0,
                  25,
                  100,
                  140,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.025Z",
                  "2026-10-17T00:00:01.000Z",
                  "2026-10-17T00:00:01.040Z",
                ],
              ),
            );
  
          await provider.generate(
            request,
          );
  
          await provider.generate(
            request,
          );
  
          const snapshot =
            provider.snapshot();
  
          expect(
            snapshot.calls,
          ).toHaveLength(2);
  
          expect(
            snapshot.successfulCalls,
          ).toBe(2);
  
          expect(
            snapshot.failedCalls,
          ).toBe(0);
  
          expect(
            snapshot.inputTokens,
          ).toBe(240);
  
          expect(
            snapshot.outputTokens,
          ).toBe(90);
  
          expect(
            snapshot
              .estimatedCostUsd,
          ).toBe(0.025);
  
          expect(
            snapshot.totalDurationMs,
          ).toBe(65);
        },
      );
  
      it(
        "returns snapshot copies that cannot mutate recorded evidence",
        async () => {
          const provider =
            new BenchmarkModelProvider(
              new SuccessfulProvider(),
  
              new FakeClock(
                [
                  0,
                  10,
                ],
                [
                  "2026-10-17T00:00:00.000Z",
                  "2026-10-17T00:00:00.010Z",
                ],
              ),
            );
  
          await provider.generate(
            request,
          );
  
          const first =
            provider.snapshot();
  
          const firstCall =
            first.calls[0];
  
          if (!firstCall) {
            throw new Error(
              "Expected recorded call.",
            );
          }
  
          firstCall.usage.inputTokens =
            999;
  
          const second =
            provider.snapshot();
  
          expect(
            second.calls[0]
              ?.usage.inputTokens,
          ).toBe(120);
        },
      );
    },
  );