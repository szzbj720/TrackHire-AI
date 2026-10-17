import type {
    CodeChangeSet,
  } from "../schemas/code-change.js";
  
  import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  
  export interface DeterministicCodeChangeProviderOptions {
    model?: string;
  
    changeSet:
      CodeChangeSet;
  
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
  }
  
  export class DeterministicCodeChangeProvider
    implements ModelProvider {
    readonly requests:
      ModelRequest[] = [];
  
    constructor(
      private readonly options:
        DeterministicCodeChangeProviderOptions,
    ) {}
  
    async generate(
      request: ModelRequest,
    ): Promise<ModelResponse> {
      this.requests.push({
        systemPrompt:
          request.systemPrompt,
  
        userPrompt:
          request.userPrompt,
      });
  
      return {
        content:
          JSON.stringify(
            this.options.changeSet,
          ),
  
        model:
          this.options.model ??
          "deterministic-code-change",
  
        usage: {
          inputTokens:
            this.options
              .inputTokens ?? 0,
  
          outputTokens:
            this.options
              .outputTokens ?? 0,
  
          estimatedCostUsd:
            this.options
              .estimatedCostUsd ?? 0,
        },
      };
    }
  }