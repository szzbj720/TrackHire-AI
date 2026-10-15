export interface ModelRequest {
    systemPrompt: string;
    userPrompt: string;
  }
  
  export interface ModelUsage {
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
  }
  
  export interface ModelResponse {
    content: string;
    model: string;
    usage?: ModelUsage;
  }
  
  export interface ModelProvider {
    generate(request: ModelRequest): Promise<ModelResponse>;
  }