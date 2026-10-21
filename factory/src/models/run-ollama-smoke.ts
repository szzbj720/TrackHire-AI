import {
    OllamaProvider,
  } from "./ollama-provider.js";
  
  async function main():
    Promise<void> {
    const provider =
      new OllamaProvider({
        model:
          "qwen2.5-coder:7b",
      });
  
    const response =
      await provider.generate({
        systemPrompt:
          "You are a software engineering assistant. Return only valid JSON.",
  
        userPrompt:
          JSON.stringify({
            task:
              "Confirm that the local model provider is working.",
  
            expectedFormat: {
              working:
                "boolean",
  
              message:
                "string",
            },
          }),
      });
  
    console.log(
      "\n=== Ollama Smoke Test ===\n",
    );
  
    console.log(
      `Model: ${response.model}`,
    );
  
    console.log(
      `Estimated API cost: $${response.usage?.estimatedCostUsd ?? 0}`,
    );
  
    console.log(
      "\nResponse:",
    );
  
    console.log(
      response.content,
    );
  }
  
  main().catch(
    (
      error,
    ) => {
      console.error(
        "\nOllama smoke test failed:",
        error,
      );
  
      process.exitCode =
        1;
    },
  );