import { resolve } from "node:path";

import type { EngineeringTask } from "../schemas/task.js";
import { buildRepositoryContext } from "./context-builder.js";

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

async function main() {
  const repositoryRoot = resolve("..");

  const context = await buildRepositoryContext(
    task,
    repositoryRoot,
    10,
  );

  console.log("\n=== Repository Intelligence ===\n");

  console.log(`Task: ${task.id}`);
  console.log(`Repository: ${context.snapshot.root}`);
  console.log(
    `Files discovered: ${context.summary.totalFiles}`,
  );

  console.log("\nTop-level areas:");
  for (const area of context.summary.topLevelAreas) {
    console.log(`- ${area}`);
  }

  console.log("\nRelevant files:");
  for (const file of context.relevantFiles) {
    console.log(
      `- ${file.path} | score=${file.score} | terms=${file.matchedTerms.join(", ")}`,
    );
  }

  console.log("\nRetrieved context:");

  for (const file of context.fileContents) {
    console.log(`\n--- ${file.path} ---`);
    console.log(
      file.content.slice(0, 500),
    );

    if (file.truncated) {
      console.log("\n[FILE TRUNCATED]");
    }
  }
}

main().catch((error) => {
  console.error(
    "Repository intelligence failed:",
    error,
  );

  process.exitCode = 1;
});