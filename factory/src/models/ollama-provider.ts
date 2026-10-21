import type {
    ModelProvider,
    ModelRequest,
    ModelResponse,
  } from "./provider.js";
  
  export interface OllamaGenerateResponse {
    model: string;
    response: string;
    prompt_eval_count?: number;
    eval_count?: number;
  }
  
  export interface OllamaHttpResponse {
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
  }
  
  export type OllamaFetch = (
    input: string,
    init?: {
      method?: string;
      headers?: Record<
        string,
        string
      >;
      body?: string;
    },
  ) => Promise<OllamaHttpResponse>;
  
  export interface OllamaProviderOptions {
    model?: string;
    baseUrl?: string;
    fetch?: OllamaFetch;
  }
  
  function defaultFetch(
    input: string,
    init?: {
      method?: string;
      headers?: Record<
        string,
        string
      >;
      body?: string;
    },
  ): Promise<OllamaHttpResponse> {
    return fetch(
      input,
      init,
    ) as Promise<OllamaHttpResponse>;
  }
  
  function parseResponse(
    value: unknown,
  ): OllamaGenerateResponse {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      throw new Error(
        "Ollama returned an invalid response.",
      );
    }
  
    const candidate =
      value as Record<
        string,
        unknown
      >;
  
    if (
      typeof candidate.model !==
        "string" ||
      typeof candidate.response !==
        "string"
    ) {
      throw new Error(
        "Ollama response is missing model or response content.",
      );
    }
  
    const result:
      OllamaGenerateResponse = {
        model:
          candidate.model,
  
        response:
          candidate.response,
      };
  
    if (
      typeof candidate.prompt_eval_count ===
      "number"
    ) {
      result.prompt_eval_count =
        candidate.prompt_eval_count;
    }
  
    if (
      typeof candidate.eval_count ===
      "number"
    ) {
      result.eval_count =
        candidate.eval_count;
    }
  
    return result;
  }
  
  export class OllamaProvider
    implements ModelProvider {
    private readonly model:
      string;
  
    private readonly baseUrl:
      string;
  
    private readonly fetchImpl:
      OllamaFetch;
  
    constructor(
      options:
        OllamaProviderOptions = {},
    ) {
      this.model =
        options.model ??
        "qwen2.5-coder:7b";
  
      this.baseUrl =
        (
          options.baseUrl ??
          "http://127.0.0.1:11434"
        ).replace(
          /\/+$/,
          "",
        );
  
      this.fetchImpl =
        options.fetch ??
        defaultFetch;
    }
  
    async generate(
      request: ModelRequest,
    ): Promise<ModelResponse> {
      const requestBody:
        Record<
          string,
          unknown
        > = {
          model:
            this.model,
  
          system:
            request.systemPrompt,
  
          prompt:
            request.userPrompt,
  
          stream:
            false,
  
          options: {
            temperature:
              0,
          },
        };
  
      if (
        request.responseSchema !==
        undefined
      ) {
        requestBody.format =
          request.responseSchema;
      }
  
      const response =
        await this.fetchImpl(
          `${this.baseUrl}/api/generate`,
          {
            method:
              "POST",
  
            headers: {
              "Content-Type":
                "application/json",
            },
  
            body:
              JSON.stringify(
                requestBody,
              ),
          },
        );
  
      if (!response.ok) {
        let detail =
          "";
  
        try {
          const errorPayload =
            await response.json();
  
          detail =
            ` ${JSON.stringify(
              errorPayload,
            )}`;
        } catch {
          detail =
            "";
        }
  
        throw new Error(
          `Ollama request failed with status ${response.status}.${detail}`,
        );
      }
  
      const payload =
        parseResponse(
          await response.json(),
        );
  
      return {
        content:
          payload.response,
  
        model:
          payload.model,
  
        usage: {
          ...(
            payload.prompt_eval_count !==
            undefined
              ? {
                  inputTokens:
                    payload.prompt_eval_count,
                }
              : {}
          ),
  
          ...(
            payload.eval_count !==
            undefined
              ? {
                  outputTokens:
                    payload.eval_count,
                }
              : {}
          ),
  
          estimatedCostUsd:
            0,
        },
      };
    }
  }