import {
    resolve,
  } from "node:path";
  
  import {
    ModelTaskAnalyzer,
  } from "./agents/analyzer.js";
  
  import {
    ModelPlanner,
  } from "./agents/planner.js";
  
  import {
    OllamaProvider,
  } from "./models/ollama-provider.js";
  
  import {
    PlanningWorkflow,
  } from "./orchestrator/planning-workflow.js";
  
  import type {
    EngineeringTask,
  } from "./schemas/task.js";
  
  function readInstruction(
    args: string[],
  ): string {
    const instruction =
      args.join(" ").trim();
  
    if (
      instruction.length === 0
    ) {
      throw new Error(
        "A TrackHire engineering instruction is required.",
      );
    }
  
    return instruction;
  }
  
  function createTask(
    instruction: string,
  ): EngineeringTask {
    const now =
      new Date().toISOString();
  
    return {
      id:
        `LOCAL-${Date.now()}`,
  
      request:
        instruction,
  
      status:
        "TASK_CREATED",
  
      requirements: [
        instruction,
      ],
  
      acceptanceCriteria: [
        "The requested behavior is implemented.",
        "Existing TrackHire behavior remains compatible unless the request explicitly changes it.",
      ],
  
      constraints: [
        "Only modify files necessary for the requested task.",
        "Do not modify the main branch directly.",
        "Preserve existing application data and behavior unless the task explicitly requires otherwise.",
      ],
  
      repairAttempts:
        0,
  
      createdAt:
        now,
  
      updatedAt:
        now,
    };
  }
  
  async function main():
    Promise<void> {
    const instruction =
      readInstruction(
        process.argv.slice(2),
      );
  
    const repositoryRoot =
      resolve("..");
  
    const provider =
      new OllamaProvider({
        model:
          process.env.OLLAMA_MODEL ??
          "qwen2.5-coder:7b",
      });
  
    const workflow =
      new PlanningWorkflow(
        new ModelTaskAnalyzer(
          provider,
        ),
  
        new ModelPlanner(
          provider,
        ),
      );
  
    const task =
      createTask(
        instruction,
      );
  
    console.log(
      "\n=== TrackHire Local AI Planning ===\n",
    );
  
    console.log(
      `Task: ${task.id}`,
    );
  
    console.log(
      `Instruction: ${task.request}`,
    );
  
    console.log(
      "\nThe local model is inspecting TrackHire and creating a plan...\n",
    );
  
    const orchestrator =
      await workflow.run(
        task,
        repositoryRoot,
      );
  
    const result =
      orchestrator.getTask();
  
    console.log(
      "=== AI Analysis ===\n",
    );
  
    console.log(
      JSON.stringify(
        result.analysis,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== AI Implementation Plan ===\n",
    );
  
    console.log(
      JSON.stringify(
        result.plan,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== Execution Strategy ===\n",
    );
  
    console.log(
      JSON.stringify(
        result.strategy,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== Factory State ===\n",
    );
  
    console.log(
      result.status,
    );
  
    if (
      result.status ===
      "AWAITING_PLAN_APPROVAL"
    ) {
      console.log(
        "\nThe AI plan is ready for human approval.",
      );
  
      console.log(
        "No TrackHire code has been modified yet.",
      );
    }
  
    if (
      result.status ===
      "NEEDS_HUMAN"
    ) {
      console.log(
        "\nThe factory decided that human input is required before implementation.",
      );
    }
  }
  
  main().catch(
    (
      error,
    ) => {
      const message =
        error instanceof Error
          ? error.message
          : String(
              error,
            );
  
      console.error(
        `\nLocal AI planning failed: ${message}`,
      );
  
      process.exitCode =
        1;
    },
  );