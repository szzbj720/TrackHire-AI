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
    ExplorationCandidateGenerator,
  } from "./exploration-candidate-generator.js";
  
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
    async generate(
      _request: ModelRequest,
    ): Promise<ModelResponse> {
      throw new Error(
        "Provider unavailable",
      );
    }
  }
  
  function createCandidateJson(
    candidateId: string,
  ): string {
    return JSON.stringify({
      candidateId,
  
      summary:
        "Add interview date support.",
  
      approach:
        "Extend the existing application model while preserving backward compatibility.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add an optional interviewDate field.",
        "Preserve existing serialization behavior.",
      ],
  
      validationSteps: [
        "Run flutter analyze.",
        "Run flutter test.",
      ],
  
      advantages: [
        "Keeps the change close to the existing model.",
      ],
  
      risks: [
        "Existing persisted data must remain compatible.",
      ],
  
      assumptions: [
        "Missing interview dates deserialize as null.",
      ],
  
      requiresHumanInput: false,
  
      confidence: 0.9,
    });
  }
  
  const request: ModelRequest = {
    systemPrompt:
      "Propose an independent implementation approach.",
    userPrompt:
      "Add optional interview date support.",
  };
  
  describe(
    "ExplorationCandidateGenerator",
    () => {
      it("generates independent validated candidates", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "explorer-a",
                provider:
                  new FakeProvider({
                    content:
                      createCandidateJson(
                        "candidate-a",
                      ),
                    model: "model-a",
                  }),
              },
              {
                id: "explorer-b",
                provider:
                  new FakeProvider({
                    content:
                      createCandidateJson(
                        "candidate-b",
                      ),
                    model: "model-b",
                  }),
              },
            ],
          );
  
        expect(
          result.results,
        ).toHaveLength(2);
  
        expect(
          result.results[0],
        ).toMatchObject({
          targetId: "explorer-a",
          status: "success",
          candidate: {
            candidateId:
              "candidate-a",
            targetId: "explorer-a",
            model: "model-a",
          },
        });
  
        expect(
          result.results[1],
        ).toMatchObject({
          targetId: "explorer-b",
          status: "success",
          candidate: {
            candidateId:
              "candidate-b",
            targetId: "explorer-b",
            model: "model-b",
          },
        });
      });
  
      it("uses execution identity instead of trusting model-supplied target and model fields", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const content = JSON.stringify({
          ...JSON.parse(
            createCandidateJson(
              "candidate-a",
            ),
          ),
          targetId:
            "fake-target",
          model: "fake-model",
        });
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "real-target",
                provider:
                  new FakeProvider({
                    content,
                    model:
                      "real-model",
                  }),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          status: "success",
          candidate: {
            targetId:
              "real-target",
            model: "real-model",
          },
        });
      });
  
      it("preserves model usage metadata", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "explorer-a",
                provider:
                  new FakeProvider({
                    content:
                      createCandidateJson(
                        "candidate-a",
                      ),
                    model: "model-a",
                    usage: {
                      inputTokens: 200,
                      outputTokens: 100,
                      estimatedCostUsd:
                        0.01,
                    },
                  }),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          status: "success",
          usage: {
            inputTokens: 200,
            outputTokens: 100,
            estimatedCostUsd: 0.01,
          },
        });
      });
  
      it("records malformed JSON as a candidate generation failure", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "explorer-a",
                provider:
                  new FakeProvider({
                    content:
                      "not-json",
                    model: "model-a",
                  }),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          targetId: "explorer-a",
          status: "error",
        });
      });
  
      it("records schema-invalid output as a candidate generation failure", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "explorer-a",
                provider:
                  new FakeProvider({
                    content:
                      JSON.stringify({
                        candidateId:
                          "candidate-a",
                      }),
                    model: "model-a",
                  }),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          targetId: "explorer-a",
          status: "error",
        });
      });
  
      it("preserves a valid candidate when another provider fails", async () => {
        const generator =
          new ExplorationCandidateGenerator();
  
        const result =
          await generator.generate(
            request,
            [
              {
                id: "explorer-a",
                provider:
                  new FakeProvider({
                    content:
                      createCandidateJson(
                        "candidate-a",
                      ),
                    model: "model-a",
                  }),
              },
              {
                id: "explorer-b",
                provider:
                  new FailingProvider(),
              },
            ],
          );
  
        expect(
          result.results[0],
        ).toMatchObject({
          targetId: "explorer-a",
          status: "success",
        });
  
        expect(
          result.results[1],
        ).toEqual({
          targetId: "explorer-b",
          status: "error",
          error:
            "Provider unavailable",
        });
      });
    },
  );