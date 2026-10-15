import OpenAI from "openai";

import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ModelUsage,
} from "./provider.js";

export class OpenAIProvider implements ModelProvider {
  private readonly client: OpenAI;

  constructor(
    private readonly model: string,
    apiKey = process.env.OPENAI_API_KEY,
  ) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }

    this.client = new OpenAI({ apiKey });
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: request.systemPrompt,
      input: request.userPrompt,
    });

    const usage: ModelUsage = {};

    if (response.usage) {
      usage.inputTokens = response.usage.input_tokens;
      usage.outputTokens = response.usage.output_tokens;
    }

    return {
      content: response.output_text,
      model: response.model,
      usage,
    };
  }
}