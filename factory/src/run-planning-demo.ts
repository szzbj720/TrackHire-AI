import { resolve } from "node:path";

import { ModelTaskAnalyzer } from "./agents/analyzer.js";
import { ModelPlanner } from "./agents/planner.js";
import { DemoPlanningProvider } from "./models/demo-provider.js";
import { PlanningWorkflow } from "./orchestrator/planning-workflow.js";
import type { EngineeringTask } from "./schemas/task.js";

const now = new Date().toISOString();

const task: EngineeringTask = {
  id: "TH-001",
  request:
    "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  status: "TASK_CREATED",
  requirements: [
    "Allow an interview date to be stored for an application.",
    "Display applications with upcoming interviews.",
  ],
  acceptanceCriteria: [
    "Applications can exist without an interview date.",
    "Applications with future interview dates can be displayed as upcoming.",
  ],
  constraints: [
    "Existing applications without interview dates must continue to work.",
  ],
  repairAttempts: 0,
  createdAt: now,
  updatedAt: now,
};

async function main(): Promise<void> {
  const repositoryRoot = resolve("..");

  const provider = new DemoPlanningProvider();

  const analyzer = new ModelTaskAnalyzer(provider);
  const planner = new ModelPlanner(provider);

  const workflow = new PlanningWorkflow(
    analyzer,
    planner,
  );

  console.log(
    "\n=== AI Software Factory: Planning Demo ===\n",
  );

  console.log(`Task: ${task.id}`);
  console.log(`Request: ${task.request}`);

  const orchestrator = await workflow.run(
    task,
    repositoryRoot,
  );

  const result = orchestrator.getTask();

  console.log("\n=== Task Analysis ===\n");
  console.log(
    JSON.stringify(result.analysis, null, 2),
  );

  console.log("\n=== Implementation Plan ===\n");
  console.log(
    JSON.stringify(result.plan, null, 2),
  );

  console.log("\n=== Workflow State ===\n");
  console.log(result.status);

  console.log("\n=== Workflow Events ===\n");

  for (const event of orchestrator.getEvents()) {
    if (event.transition) {
      console.log(
        `${event.transition.from} -> ${event.transition.to}`,
      );
    }
  }

  if (result.status === "AWAITING_PLAN_APPROVAL") {
    console.log(
      "\nHuman approval is required before implementation can begin.",
    );
  }
}

main().catch((error) => {
  console.error(
    "Planning workflow failed:",
    error,
  );

  process.exitCode = 1;
});