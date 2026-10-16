import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "./provider.js";
  import {
    MultiModelRunner,
  } from "./multi-model-runner.js";
  
  class FakeProvider
    implements ModelProvider
  {
    constructor(
      private readonly response:
        ModelResponse,
    ) {}
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      return this.response;
    }
  }
  
  class FailingProvider
    implements ModelProvider
  {
    constructor(
      private readonly message:
        string,
    ) {}
  
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      throw new Error(this.message);
    }
  }
  
  const request: ModelRequest = {
    systemPrompt:
      "Review the implementation.",
    userPrompt:
      "Determine whether the change is safe.",
  };
  
  describe("MultiModelRunner", () => {
    it("runs the same request against multiple providers", async () => {
      const runner =
        new MultiModelRunner();
  
      const result =
        await runner.run(
          request,
          [
            {
              id: "reviewer-a",
              provider:
                new FakeProvider({
                  content:
                    "Implementation looks safe.",
                  model:
                    "test-model-a",
                }),
            },
            {
              id: "reviewer-b",
              provider:
                new FakeProvider({
                  content:
                    "Implementation needs review.",
                  model:
                    "test-model-b",
                }),
            },
          ],
        );
  
      expect(result.results).toEqual([
        {
          targetId: "reviewer-a",
          status: "success",
          response: {
            content:
              "Implementation looks safe.",
            model:
              "test-model-a",
          },
        },
        {
          targetId: "reviewer-b",
          status: "success",
          response: {
            content:
              "Implementation needs review.",
            model:
              "test-model-b",
          },
        },
      ]);
    });
  
    it("preserves successful results when another provider fails", async () => {
      const runner =
        new MultiModelRunner();
  
      const result =
        await runner.run(
          request,
          [
            {
              id: "working-reviewer",
              provider:
                new FakeProvider({
                  content: "Approved.",
                  model:
                    "working-model",
                }),
            },
            {
              id: "failing-reviewer",
              provider:
                new FailingProvider(
                  "Provider unavailable",
                ),
            },
          ],
        );
  
      expect(result.results).toEqual([
        {
          targetId:
            "working-reviewer",
          status: "success",
          response: {
            content: "Approved.",
            model:
              "working-model",
          },
        },
        {
          targetId:
            "failing-reviewer",
          status: "error",
          error:
            "Provider unavailable",
        },
      ]);
    });
  
    it("preserves model usage metadata", async () => {
      const runner =
        new MultiModelRunner();
  
      const result =
        await runner.run(
          request,
          [
            {
              id: "reviewer",
              provider:
                new FakeProvider({
                  content: "Approved.",
                  model:
                    "usage-test-model",
                  usage: {
                    inputTokens: 120,
                    outputTokens: 30,
                    estimatedCostUsd:
                      0.004,
                  },
                }),
            },
          ],
        );
  
      expect(result.results[0]).toEqual({
        targetId: "reviewer",
        status: "success",
        response: {
          content: "Approved.",
          model: "usage-test-model",
          usage: {
            inputTokens: 120,
            outputTokens: 30,
            estimatedCostUsd: 0.004,
          },
        },
      });
    });
  
    it("rejects an empty target list", async () => {
      const runner =
        new MultiModelRunner();
  
      await expect(
        runner.run(request, []),
      ).rejects.toThrow(
        "Multi-model run requires at least one execution target.",
      );
    });
  
    it("rejects duplicate execution target IDs", async () => {
      const runner =
        new MultiModelRunner();
  
      const provider =
        new FakeProvider({
          content: "Approved.",
          model: "test-model",
        });
  
      await expect(
        runner.run(
          request,
          [
            {
              id: "reviewer",
              provider,
            },
            {
              id: "reviewer",
              provider,
            },
          ],
        ),
      ).rejects.toThrow(
        "Duplicate model execution target: reviewer",
      );
    });
  
    it("records non-Error provider failures", async () => {
      const provider: ModelProvider = {
        async generate():
          Promise<ModelResponse> {
          throw "provider failure";
        },
      };
  
      const runner =
        new MultiModelRunner();
  
      const result =
        await runner.run(
          request,
          [
            {
              id: "reviewer",
              provider,
            },
          ],
        );
  
      expect(result.results).toEqual([
        {
          targetId: "reviewer",
          status: "error",
          error: "provider failure",
        },
      ]);
    });
  });