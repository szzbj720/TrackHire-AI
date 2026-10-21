import {
    createInterface,
  } from "node:readline/promises";
  import {
    stdin as input,
    stdout as output,
  } from "node:process";
  import {
    resolve,
  } from "node:path";
  
  import {
    ModelTaskAnalyzer,
  } from "./agents/analyzer.js";
  import {
    ModelBuilder,
  } from "./agents/builder.js";
  import {
    ModelDiagnostician,
  } from "./agents/diagnostician.js";
  import {
    ModelPlanner,
  } from "./agents/planner.js";
  import {
    ModelRepairer,
  } from "./agents/repairer.js";
  import {
    OllamaProvider,
  } from "./models/ollama-provider.js";
  import {
    DiagnosisWorkflow,
  } from "./orchestrator/diagnosis-workflow.js";
  import {
    LightweightWorkflow,
  } from "./orchestrator/lightweight-workflow.js";
  import {
    Orchestrator,
  } from "./orchestrator/orchestrator.js";
  import {
    PlanningWorkflow,
  } from "./orchestrator/planning-workflow.js";
  import {
    RepairWorkflow,
  } from "./orchestrator/repair-workflow.js";
  import type {
    ImplementationResult,
  } from "./schemas/implementation.js";
  import type {
    EngineeringTask,
  } from "./schemas/task.js";
  import type {
    ValidationResult,
  } from "./schemas/validation.js";
  import {
    ProcessCommandRunner,
  } from "./validation/command-runner.js";
  import {
    DeterministicValidator,
  } from "./validation/validator.js";
  
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
      id: `LOCAL-${Date.now()}`,
      request: instruction,
      status: "TASK_CREATED",
  
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
  
      repairAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  async function askForApproval(
    question: string,
  ): Promise<boolean> {
    const readline =
      createInterface({
        input,
        output,
      });
  
    try {
      const answer =
        await readline.question(
          `${question} (y/n): `,
        );
  
      return [
        "y",
        "yes",
      ].includes(
        answer
          .trim()
          .toLowerCase(),
      );
    } finally {
      readline.close();
    }
  }
  
  function printPlanningResult(
    task: EngineeringTask,
  ): void {
    console.log(
      "\n=== AI Analysis ===\n",
    );
  
    console.log(
      JSON.stringify(
        task.analysis,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== AI Implementation Plan ===\n",
    );
  
    console.log(
      JSON.stringify(
        task.plan,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== Execution Strategy ===\n",
    );
  
    console.log(
      JSON.stringify(
        task.strategy,
        null,
        2,
      ),
    );
  
    console.log(
      "\n=== Factory State ===\n",
    );
  
    console.log(
      task.status,
    );
  }
  
  function printValidation(
    validation:
      ValidationResult | undefined,
  ): void {
    console.log(
      "\n=== Validation Result ===\n",
    );
  
    console.log(
      JSON.stringify(
        validation,
        null,
        2,
      ),
    );
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
  
    const planningWorkflow =
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
      "\n=== TrackHire Local AI Factory ===\n",
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
  
    const planningOrchestrator =
      await planningWorkflow.run(
        task,
        repositoryRoot,
      );
  
    const plannedTask =
      planningOrchestrator.getTask();
  
    printPlanningResult(
      plannedTask,
    );
  
    if (
      plannedTask.status ===
      "NEEDS_HUMAN"
    ) {
      console.log(
        "\nThe factory requires human input before implementation.",
      );
  
      return;
    }
  
    if (
      plannedTask.status !==
      "AWAITING_PLAN_APPROVAL"
    ) {
      throw new Error(
        `Unexpected planning state: ${plannedTask.status}`,
      );
    }
  
    if (
      plannedTask.strategy?.mode !==
      "single-agent"
    ) {
      console.log(
        `\nThis local runner currently supports single-agent execution only. The factory selected: ${plannedTask.strategy?.mode ?? "unknown"}.`,
      );
  
      console.log(
        "No TrackHire code has been modified.",
      );
  
      return;
    }
  
    const approved =
      await askForApproval(
        "\nApprove this implementation plan?",
      );
  
    if (!approved) {
      console.log(
        "\nPlan rejected. No TrackHire code has been modified.",
      );
  
      return;
    }
  
    console.log(
      "\nPlan approved.",
    );
  
    console.log(
      "Creating an isolated worktree and asking the local model to implement the change...\n",
    );
  
    const validator =
      new DeterministicValidator(
        new ProcessCommandRunner(),
        [
          {
            name:
              "flutter analyze",
            command:
              "flutter",
            args: [
              "analyze",
            ],
          },
          {
            name:
              "flutter test",
            command:
              "flutter",
            args: [
              "test",
            ],
          },
        ],
      );
  
    const executionWorkflow =
      new LightweightWorkflow(
        new ModelBuilder(
          provider,
        ),
        validator,
      );
  
    const result =
      await executionWorkflow.run(
        plannedTask,
        repositoryRoot,
        "main",
      );
  
    let currentTask =
      result.task;
  
    let currentValidation =
      result.validation;
  
    let latestImplementation:
      ImplementationResult =
        result.implementation;
  
    console.log(
      "\n=== AI Implementation Result ===\n",
    );
  
    console.log(
      JSON.stringify(
        result.implementation,
        null,
        2,
      ),
    );
  
    printValidation(
      currentValidation,
    );
  
    if (
      currentTask.status ===
        "DIAGNOSING_FAILURE" &&
      currentValidation
    ) {
      const diagnosisWorkflow =
        new DiagnosisWorkflow(
          new ModelDiagnostician(
            provider,
          ),
        );
  
      const repairWorkflow =
        new RepairWorkflow(
          new ModelRepairer(
            provider,
          ),
          validator,
          2,
        );
  
      while (
        currentTask.status ===
          "DIAGNOSING_FAILURE" &&
        currentValidation
      ) {
        console.log(
          `\n=== AI Failure Diagnosis ${currentTask.repairAttempts + 1} ===\n`,
        );
  
        const diagnosisResult =
          await diagnosisWorkflow.run({
            task: currentTask,
            implementation:
              latestImplementation,
            validation:
              currentValidation,
            worktreePath:
              result.worktree.path,
          });
  
        currentTask =
          diagnosisResult.task;
  
        console.log(
          JSON.stringify(
            diagnosisResult.diagnosis,
            null,
            2,
          ),
        );
  
        if (
          currentTask.status ===
          "NEEDS_HUMAN"
        ) {
          break;
        }
  
        console.log(
          `\n=== AI Repair Attempt ${currentTask.repairAttempts + 1} ===\n`,
        );
  
        const repairResult =
          await repairWorkflow.run({
            task: currentTask,
            implementation:
              latestImplementation,
            validation:
              currentValidation,
            diagnosis:
              diagnosisResult.diagnosis,
            worktreePath:
              result.worktree.path,
          });
  
        currentTask =
          repairResult.task;
  
        currentValidation =
          repairResult.validation;
  
        if (
          repairResult.repair
        ) {
          latestImplementation =
            repairResult.repair;
  
          console.log(
            JSON.stringify(
              repairResult.repair,
              null,
              2,
            ),
          );
        }
  
        printValidation(
          currentValidation,
        );
  
        if (
          currentTask.status ===
          "REVIEWING"
        ) {
          const orchestrator =
            new Orchestrator(
              currentTask,
            );
  
          orchestrator.transition(
            "AWAITING_FINAL_APPROVAL",
          );
  
          currentTask =
            orchestrator.getTask();
  
          break;
        }
      }
    }
  
    console.log(
      "\n=== Worktree ===\n",
    );
  
    console.log(
      result.worktree.path,
    );
  
    console.log(
      "\n=== Factory State ===\n",
    );
  
    console.log(
      currentTask.status,
    );
  
    if (
      currentTask.status ===
      "AWAITING_FINAL_APPROVAL"
    ) {
      console.log(
        "\nThe implementation passed deterministic validation.",
      );
  
      console.log(
        "The changes remain isolated in the worktree.",
      );
  
      console.log(
        "Nothing has been merged into main.",
      );
    }
  
    if (
      currentTask.status ===
      "NEEDS_HUMAN"
    ) {
      console.log(
        "\nThe implementation requires human review before continuing.",
      );
  
      console.log(
        "The worktree has been preserved for inspection.",
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
        `\nLocal AI factory failed: ${message}`,
      );
  
      process.exitCode = 1;
    },
  );