import type {
    ModelExecutionTarget,
  } from "./multi-model-runner.js";
  import {
    MultiModelRunner,
  } from "./multi-model-runner.js";
  import type {
    ModelRequest,
    ModelUsage,
  } from "./provider.js";
  import {
    explorationCandidateSchema,
  } from "../schemas/exploration-candidate.js";
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  
  export interface SuccessfulCandidateGeneration {
    targetId: string;
    status: "success";
    candidate: ExplorationCandidate;
    usage?: ModelUsage;
  }
  
  export interface FailedCandidateGeneration {
    targetId: string;
    status: "error";
    error: string;
  }
  
  export type CandidateGenerationResult =
    | SuccessfulCandidateGeneration
    | FailedCandidateGeneration;
  
  export interface ExplorationGenerationResult {
    results: CandidateGenerationResult[];
  }
  
  export class ExplorationCandidateGenerator {
    constructor(
      private readonly runner:
        MultiModelRunner =
          new MultiModelRunner(),
    ) {}
  
    async generate(
      request: ModelRequest,
      targets: ModelExecutionTarget[],
    ): Promise<ExplorationGenerationResult> {
      const runResult =
        await this.runner.run(
          request,
          targets,
        );
  
      const results =
        runResult.results.map(
          (result):
            CandidateGenerationResult => {
            if (result.status === "error") {
              return {
                targetId:
                  result.targetId,
                status: "error",
                error: result.error,
              };
            }
  
            try {
              const parsed =
                JSON.parse(
                  result.response.content,
                ) as unknown;
  
              const candidate =
                explorationCandidateSchema.parse(
                  {
                    ...(typeof parsed ===
                      "object" &&
                    parsed !== null
                      ? parsed
                      : {}),
                    targetId:
                      result.targetId,
                    model:
                      result.response.model,
                  },
                );
  
              return {
                targetId:
                  result.targetId,
                status: "success",
                candidate,
                ...(result.response.usage
                  ? {
                      usage:
                        result.response
                          .usage,
                    }
                  : {}),
              };
            } catch (error) {
              return {
                targetId:
                  result.targetId,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : String(error),
              };
            }
          },
        );
  
      return { results };
    }
  }