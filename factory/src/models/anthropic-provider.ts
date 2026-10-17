import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "./provider.js";
  
  export interface AnthropicTextBlock {
    type: "text";
    text: string;
  }
  
  export interface AnthropicOtherBlock {
    type: string;
  }
  
  export type AnthropicContentBlock =
    | AnthropicTextBlock
    | AnthropicOtherBlock;
  
  export interface AnthropicMessageUsage {
    input_tokens: number;
    output_tokens: number;
  }
  
  export interface AnthropicMessage {
    model: string;
  
    content:
      AnthropicContentBlock[];
  
    usage:
      AnthropicMessageUsage;
  }
  
  export interface AnthropicMessageCreateInput {
    model: string;
    max_tokens: number;
    system: string;
  
    messages: Array<{
      role: "user";
      content: string;
    }>;
  }
  
  export interface AnthropicMessagesClient {
    create(
      input:
        AnthropicMessageCreateInput,
    ): Promise<AnthropicMessage>;
  }
  
  export interface AnthropicClient {
    messages:
      AnthropicMessagesClient;
  }
  
  export interface AnthropicProviderOptions {
    client:
      AnthropicClient;
  
    model: string;
  
    maxTokens?: number;
  }
  
  function textContent(
    blocks:
      AnthropicContentBlock[],
  ): string {
    return blocks
      .filter(
        (
          block,
        ): block is AnthropicTextBlock =>
          block.type === "text" &&
          "text" in block,
      )
      .map(
        (block) =>
          block.text,
      )
      .join("");
  }
  
  export class AnthropicProvider
    implements ModelProvider {
    private readonly maxTokens:
      number;
  
    constructor(
      private readonly options:
        AnthropicProviderOptions,
    ) {
      this.maxTokens =
        options.maxTokens ?? 4096;
    }
  
    async generate(
      request: ModelRequest,
    ): Promise<ModelResponse> {
      const message =
        await this.options
          .client
          .messages
          .create({
            model:
              this.options.model,
  
            max_tokens:
              this.maxTokens,
  
            system:
              request.systemPrompt,
  
            messages: [
              {
                role:
                  "user",
  
                content:
                  request.userPrompt,
              },
            ],
          });
  
      return {
        content:
          textContent(
            message.content,
          ),
  
        model:
          message.model,
  
        usage: {
          inputTokens:
            message.usage
              .input_tokens,
  
          outputTokens:
            message.usage
              .output_tokens,
        },
      };
    }
  }