import "dotenv/config";

import { Orchestrator } from "./orchestrator/orchestrator.js";
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

const orchestrator = new Orchestrator(task);

console.log("Initial state:", orchestrator.getTask().status);

orchestrator.transition("ANALYZING");
orchestrator.transition("PLANNING");
orchestrator.transition("AWAITING_PLAN_APPROVAL");

console.log("Current state:", orchestrator.getTask().status);
console.log(
  "Events:",
  JSON.stringify(orchestrator.getEvents(), null, 2),
);