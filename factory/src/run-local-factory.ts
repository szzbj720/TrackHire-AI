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
  ModelReviewer,
} from "./agents/reviewer.js";
import {
  OllamaProvider,
} from "./models/ollama-provider.js";
import {
  createAdaptiveFactory,
} from "./orchestrator/adaptive-factory-composition.js";
import {
  DiagnosisWorkflow,
} from "./orchestrator/diagnosis-workflow.js";
import {
  FactoryEntrypoint,
} from "./orchestrator/factory-entrypoint.js";
import {
  FactoryRunner,
} from "./orchestrator/factory-runner.js";
import {
  ImplementationWorkflow,
} from "./orchestrator/implementation-workflow.js";
import {
  LightweightWorkflow,
} from "./orchestrator/lightweight-workflow.js";
import {
  PlanningWorkflow,
} from "./orchestrator/planning-workflow.js";
import {
  RepairWorkflow,
} from "./orchestrator/repair-workflow.js";
import {
  ReviewWorkflow,
} from "./orchestrator/review-workflow.js";
import {
  SequentialFactory,
} from "./orchestrator/sequential-factory.js";
import {
  TrustDecisionWorkflow,
} from "./orchestrator/trust-decision-workflow.js";
import {
  TrustRetryWorkflow,
} from "./orchestrator/trust-retry-workflow.js";
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
import {
  VerificationExecutor,
} from "./verification/verification-executor.js";
import {
  ModelVerificationPlanner,
} from "./verification/verification-planner.js";
import {
  AllowlistedVerificationProbePolicy,
} from "./verification/verification-probe-policy.js";
import {
  VerificationWorkflow,
} from "./verification/verification-workflow.js";

function readInstruction(args: string[]): string {
  const instruction = args.join(" ").trim();
  if (instruction.length === 0) {
    throw new Error("A TrackHire engineering instruction is required.");
  }
  return instruction;
}

function createTask(instruction: string): EngineeringTask {
  const now = new Date().toISOString();
  return {
    id: `LOCAL-${Date.now()}`,
    request: instruction,
    status: "TASK_CREATED",
    requirements: [instruction],
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

async function askForApproval(question: string): Promise<boolean> {
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(`${question} (y/n): `);
    return ["y", "yes"].includes(answer.trim().toLowerCase());
  } finally {
    readline.close();
  }
}

function printPlanningResult(task: EngineeringTask): void {
  console.log("\n=== AI Analysis ===\n");
  console.log(JSON.stringify(task.analysis, null, 2));
  console.log("\n=== AI Implementation Plan ===\n");
  console.log(JSON.stringify(task.plan, null, 2));
  console.log("\n=== Execution Strategy ===\n");
  console.log(JSON.stringify(task.strategy, null, 2));
  console.log("\n=== Factory State ===\n");
  console.log(task.status);
}

function printValidation(validation: ValidationResult | undefined): void {
  console.log("\n=== Validation Result ===\n");
  console.log(JSON.stringify(validation, null, 2));
}

async function main(): Promise<void> {
  const instruction = readInstruction(process.argv.slice(2));
  const repositoryRoot = resolve("..");
  const provider = new OllamaProvider({
    model: process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b",
  });

  const planningWorkflow = new PlanningWorkflow(
    new ModelTaskAnalyzer(provider),
    new ModelPlanner(provider),
  );
  const commandRunner = new ProcessCommandRunner();
  const validator = new DeterministicValidator(commandRunner, [
    { name: "flutter analyze", command: "flutter", args: ["analyze"] },
    { name: "flutter test", command: "flutter", args: ["test"] },
  ]);
  const builder = new ModelBuilder(provider);
  const repairer = new ModelRepairer(provider);
  const diagnosisWorkflow = new DiagnosisWorkflow(
    new ModelDiagnostician(provider),
  );
  const repairWorkflow = new RepairWorkflow(repairer, validator, 2);
  const reviewWorkflow = new ReviewWorkflow(new ModelReviewer(provider));
  const verificationWorkflow = new VerificationWorkflow(
    new ModelVerificationPlanner(provider),
    new VerificationExecutor(
      commandRunner,
      new AllowlistedVerificationProbePolicy(),
    ),
  );
  const trustDecisionWorkflow = new TrustDecisionWorkflow();
  const trustRetryWorkflow = new TrustRetryWorkflow(repairer, validator, 2);
  const lightweightWorkflow = new LightweightWorkflow(builder, validator);
  const sequentialFactory = new SequentialFactory(
    planningWorkflow,
    new ImplementationWorkflow(builder, validator),
    diagnosisWorkflow,
    repairWorkflow,
    reviewWorkflow,
    undefined,
    verificationWorkflow,
    trustDecisionWorkflow,
    trustRetryWorkflow,
  );
  const adaptiveFactory = createAdaptiveFactory(
    provider,
    sequentialFactory,
    lightweightWorkflow,
    builder,
    validator,
    diagnosisWorkflow,
    repairWorkflow,
    reviewWorkflow,
  );
  const factoryRunner = new FactoryRunner(
    sequentialFactory,
    lightweightWorkflow,
    adaptiveFactory,
  );
  const factoryEntrypoint = new FactoryEntrypoint(
    planningWorkflow,
    factoryRunner,
  );

  const task = createTask(instruction);
  console.log("\n=== TrackHire Local AI Factory ===\n");
  console.log(`Task: ${task.id}`);
  console.log(`Instruction: ${task.request}`);
  console.log("\nThe local model is inspecting TrackHire and creating a plan...\n");

  const planningResult = await factoryEntrypoint.plan(task, repositoryRoot);
  const plannedTask = planningResult.plannedTask;
  printPlanningResult(plannedTask);

  if (planningResult.stopReason === "HUMAN_INPUT_REQUIRED") {
    console.log("\nThe factory requires human input before implementation.");
    return;
  }

  const approved = await askForApproval("\nApprove this implementation plan?");
  if (!approved) {
    console.log("\nPlan rejected. No TrackHire code has been modified.");
    return;
  }

  console.log("\nPlan approved.");
  console.log("Creating an isolated worktree and asking the local model to implement the change...\n");

  let execution = await factoryEntrypoint.resumeAfterPlanApproval(
    plannedTask,
    repositoryRoot,
    new Date().toISOString(),
    "main",
  );

  console.log("\n=== Run Trace ===\n");
  console.log(JSON.stringify(execution.trace, null, 2));

  if (execution.adaptiveResult) {
    let result = execution.adaptiveResult;
    console.log("\n=== Parallel Factory Result ===\n");
    console.log(JSON.stringify({
      stopReason: result.stopReason,
      taskStatus: result.run.task.status,
      workGraph: result.workGraph,
    }, null, 2));

    if (result.stopReason === "PARALLEL_APPROVAL_REQUIRED") {
      console.log("\n=== Proposed Parallel Work Graph ===\n");
      console.log(JSON.stringify(result.workGraph, null, 2));
      console.log("\nNo parallel implementation has started yet.");

      const parallelApproved = await askForApproval(
        "Approve this parallel work decomposition?",
      );

      if (!parallelApproved) {
        console.log("\nParallel decomposition rejected. No parallel implementation has started.");
        return;
      }

      console.log("\nParallel decomposition approved. Starting controlled parallel execution...\n");
      execution = await factoryRunner.resumeAfterParallelApproval(
        result,
        execution.trace,
        repositoryRoot,
        "main",
      );
      result = execution.adaptiveResult!;

      console.log("\n=== Continued Run Trace ===\n");
      console.log(JSON.stringify(execution.trace, null, 2));
      console.log("\n=== Parallel Factory Result After Approval ===\n");
      console.log(JSON.stringify({
        stopReason: result.stopReason,
        taskStatus: result.run.task.status,
        parallelExecution: result.parallelExecution,
      }, null, 2));
    }

    if (result.stopReason === "PARALLEL_VALIDATION_REQUIRED") {
      console.log("\nParallel implementation completed in isolated worktrees. Running integrated validation...\n");
      execution = await factoryRunner.resumeAfterParallelValidation(
        result,
        execution.trace,
      );
      result = execution.adaptiveResult!;

      console.log("\n=== Parallel Validation Result ===\n");
      console.log(JSON.stringify({
        stopReason: result.stopReason,
        taskStatus: result.run.task.status,
        validation: result.parallelValidation?.validation,
        review: result.parallelValidation?.review?.review,
      }, null, 2));
    }

    while (result.stopReason === "PARALLEL_DIAGNOSIS_REQUIRED") {
      console.log(`\n=== Parallel Failure Diagnosis ${result.run.task.repairAttempts + 1} ===\n`);
      execution = await factoryRunner.resumeAfterParallelDiagnosis(
        result,
        execution.trace,
      );
      result = execution.adaptiveResult!;
      console.log(JSON.stringify(result.diagnosis, null, 2));

      if (result.stopReason !== "PARALLEL_REPAIR_REQUIRED") {
        break;
      }

      console.log(`\n=== Parallel Repair Attempt ${result.run.task.repairAttempts + 1} ===\n`);
      execution = await factoryRunner.resumeAfterParallelRepair(
        result,
        execution.trace,
      );
      result = execution.adaptiveResult!;
      printValidation(result.run.validation);

      if (result.stopReason === "PARALLEL_REVIEW_REQUIRED") {
        console.log("\nParallel repair passed validation. Running integrated review...\n");
        execution = await factoryRunner.resumeAfterParallelReview(
          result,
          execution.trace,
        );
        result = execution.adaptiveResult!;
      }
    }

    console.log("\n=== Continued Run Trace ===\n");
    console.log(JSON.stringify(execution.trace, null, 2));

    if (result.stopReason === "FINAL_APPROVAL_REQUIRED") {
      console.log("\nThe integrated parallel implementation passed validation and review and reached the final human approval gate.");
      console.log("The changes remain isolated in the integration worktree.");
      console.log("Nothing has been merged into main.");
      return;
    }

    if (result.stopReason === "HUMAN_INPUT_REQUIRED") {
      console.log("\nThe parallel factory requires human input before continuing.");
      return;
    }

    if (result.stopReason === "FAILED") {
      console.log("\nParallel execution failed. Inspect the preserved worktrees and trace before continuing.");
      return;
    }

    throw new Error(
      `Local runner received unsupported adaptive stop reason ${result.stopReason}.`,
    );
  }

  if (execution.lightweightResult) {
    const result = execution.lightweightResult;
    let currentTask = result.task;
    let currentValidation = result.validation;
    let latestImplementation: ImplementationResult = result.implementation;

    console.log("\n=== AI Implementation Result ===\n");
    console.log(JSON.stringify(result.implementation, null, 2));
    printValidation(currentValidation);

    if (currentTask.status === "DIAGNOSING_FAILURE" && currentValidation) {
      while (currentTask.status === "DIAGNOSING_FAILURE" && currentValidation) {
        console.log(`\n=== AI Failure Diagnosis ${currentTask.repairAttempts + 1} ===\n`);
        const diagnosisResult = await diagnosisWorkflow.run({
          task: currentTask,
          implementation: latestImplementation,
          validation: currentValidation,
          worktreePath: result.worktree.path,
        });
        currentTask = diagnosisResult.task;
        console.log(JSON.stringify(diagnosisResult.diagnosis, null, 2));
        if (currentTask.status === "NEEDS_HUMAN") break;

        console.log(`\n=== AI Repair Attempt ${currentTask.repairAttempts + 1} ===\n`);
        const repairResult = await repairWorkflow.run({
          task: currentTask,
          implementation: latestImplementation,
          validation: currentValidation,
          diagnosis: diagnosisResult.diagnosis,
          worktreePath: result.worktree.path,
        });
        currentTask = repairResult.task;
        currentValidation = repairResult.validation;
        if (repairResult.repair) {
          latestImplementation = repairResult.repair;
          console.log(JSON.stringify(repairResult.repair, null, 2));
        }
        printValidation(currentValidation);
      }
    }

    console.log("\n=== Worktree ===\n");
    console.log(result.worktree.path);
    console.log("\n=== Factory State ===\n");
    console.log(currentTask.status);

    if (currentTask.status === "AWAITING_FINAL_APPROVAL") {
      console.log("\nThe implementation passed deterministic validation and reached the final human approval gate.");
      const finalApproved = await askForApproval(
        "Approve the final lightweight implementation?",
      );

      if (!finalApproved) {
        console.log("\nFinal approval rejected. The worktree has been preserved for inspection.");
        return;
      }

      if (!currentValidation) {
        throw new Error(
          "Lightweight final approval requires a completed validation result.",
        );
      }

      execution = await factoryRunner.resumeAfterLightweightFinalApproval(
        {
          ...result,
          task: currentTask,
          implementation: latestImplementation,
          validation: currentValidation,
        },
        execution.trace,
      );
      const approvedResult = execution.lightweightResult!;

      console.log("\n=== Final Run Trace ===\n");
      console.log(JSON.stringify(execution.trace, null, 2));
      console.log("\n=== Factory State ===\n");
      console.log(approvedResult.task.status);

      if (approvedResult.task.status !== "COMPLETE") {
        throw new Error(
          `Lightweight final approval returned unexpected state ${approvedResult.task.status}.`,
        );
      }

      console.log("\nFinal lightweight implementation approved. Factory run complete.");
      console.log("The changes remain isolated in the worktree.");
      console.log("Nothing has been merged into main.");
      return;
    }
    if (currentTask.status === "NEEDS_HUMAN") {
      console.log("\nThe implementation requires human review before continuing.");
      console.log("The worktree has been preserved for inspection.");
    }
    return;
  }

  if (execution.sequentialResult) {
    let result = execution.sequentialResult;
    if (result.stopReason === "TRUST_RETRY_REQUIRED") {
      console.log("\nThe trust decision found actionable evidence that qualifies for a bounded repair retry.");
      const retryApproved = await askForApproval(
        "Approve one bounded trust repair retry?",
      );
      if (retryApproved) {
        console.log("\nTrust repair retry approved. Re-running the sequential verification lifecycle...\n");
        execution = await factoryRunner.resumeAfterTrustRetry(
          result,
          execution.trace,
        );
        result = execution.sequentialResult!;
      } else {
        console.log("\nTrust repair retry rejected. The worktree has been preserved for inspection.");
      }
    }

    let run = result.run;
    console.log("\n=== Sequential Factory Result ===\n");
    console.log(JSON.stringify({
      stopReason: result.stopReason,
      taskStatus: run.task.status,
      validation: run.validation,
      verification: run.verification,
      review: run.review,
      trustDecision: run.trustDecision,
    }, null, 2));

    if (run.worktree) {
      console.log("\n=== Worktree ===\n");
      console.log(run.worktree.path);
    }
    console.log("\n=== Factory State ===\n");
    console.log(run.task.status);

    if (result.stopReason === "FINAL_APPROVAL_REQUIRED") {
      console.log("\nThe sequential factory reached the final human approval gate after independent verification, review, and trust evaluation.");
      const finalApproved = await askForApproval(
        "Approve the final sequential implementation?",
      );

      if (!finalApproved) {
        console.log("\nFinal approval rejected. The worktree has been preserved for inspection.");
        return;
      }

      execution = await factoryRunner.resumeAfterSequentialFinalApproval(
        result,
        execution.trace,
      );
      result = execution.sequentialResult!;
      run = result.run;

      console.log("\n=== Final Run Trace ===\n");
      console.log(JSON.stringify(execution.trace, null, 2));
      console.log("\n=== Factory State ===\n");
      console.log(run.task.status);

      if (result.stopReason !== "COMPLETE" || run.task.status !== "COMPLETE") {
        throw new Error(
          `Sequential final approval returned unexpected stop reason ${result.stopReason} with task state ${run.task.status}.`,
        );
      }

      console.log("\nFinal sequential implementation approved. Factory run complete.");
      console.log("The changes remain isolated in the worktree.");
      console.log("Nothing has been merged into main.");
      return;
    }
    if (result.stopReason === "TRUST_RETRY_REQUIRED") {
      console.log("\nThe trust decision still requires a bounded retry or human inspection.");
      console.log("No additional retry has been started automatically. The worktree has been preserved.");
    }
    if (result.stopReason === "HUMAN_INPUT_REQUIRED") {
      console.log("\nThe sequential factory requires human input before continuing.");
    }
    return;
  }

  throw new Error(
    `Local runner received unsupported route ${execution.decision.route}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nLocal AI factory failed: ${message}`);
  process.exitCode = 1;
});