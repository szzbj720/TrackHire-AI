import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "./provider.js";
  
  export interface ModelExecutionTarget {
    id: string;
    provider: ModelProvider;
  }
  
  export interface SuccessfulModelExecution {
    targetId: string;
    status: "success";
    response: ModelResponse;
  }
  
  export interface FailedModelExecution {
    targetId: string;
    status: "error";
    error: string;
  }
  
  export type ModelExecutionResult =
    | SuccessfulModelExecution
    | FailedModelExecution;
  
  export interface MultiModelRunResult {
    results: ModelExecutionResult[];
  }
  
  export class MultiModelRunner {
    async run(
      request: ModelRequest,
      targets: ModelExecutionTarget[],
    ): Promise<MultiModelRunResult> {
      if (targets.length === 0) {
        throw new Error(
          "Multi-model run requires at least one execution target.",
        );
      }
  
      this.assertUniqueTargetIds(targets);
  
      const results = await Promise.all(
        targets.map((target) =>
          this.executeTarget(
            request,
            target,
          ),
        ),
      );
  
      return { results };
    }
  
    private async executeTarget(
      request: ModelRequest,
      target: ModelExecutionTarget,
    ): Promise<ModelExecutionResult> {
      try {
        const response =
          await target.provider.generate(
            request,
          );
  
        return {
          targetId: target.id,
          status: "success",
          response,
        };
      } catch (error) {
        return {
          targetId: target.id,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        };
      }
    }
  
    private assertUniqueTargetIds(
      targets: ModelExecutionTarget[],
    ): void {
      const ids = new Set<string>();
  
      for (const target of targets) {
        if (ids.has(target.id)) {
          throw new Error(
            `Duplicate model execution target: ${target.id}`,
          );
        }
  
        ids.add(target.id);
      }
    }
  }