import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "../models/provider.js";
  
  import type {
    FailureDiagnosis,
  } from "../schemas/diagnosis.js";
  
  export interface DeterministicDiagnosisProviderOptions {
    model?: string;
  
    diagnosis:
      FailureDiagnosis;
  
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
  }
  
  export class DeterministicDiagnosisProvider
    implements ModelProvider {
    readonly requests:
      ModelRequest[] = [];
  
    constructor(
      private readonly options:
        DeterministicDiagnosisProviderOptions,
    ) {}
  
    async generate(
      request: ModelRequest,
    ): Promise<ModelResponse> {
      this.requests.push(request);
  
      return {
        content:
          JSON.stringify(
            this.options.diagnosis,
          ),
  
        model:
          this.options.model ??
          "deterministic-diagnosis",
  
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