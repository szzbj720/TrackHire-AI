import { describe, expect, it } from "vitest";

import type { EngineeringTask } from "../schemas/task.js";
import { Orchestrator } from "./orchestrator.js";

function createTask(): EngineeringTask {
  const now = new Date().toISOString();

  return {
    id: "TH-001",
    request: "Add optional interview date tracking.",
    status: "TASK_CREATED",
    requirements: [],
    acceptanceCriteria: [],
    constraints: [],
    repairAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

describe("Orchestrator", () => {
  it("moves a task through a valid transition", () => {
    const orchestrator = new Orchestrator(createTask());

    orchestrator.transition("ANALYZING");

    expect(orchestrator.getTask().status).toBe("ANALYZING");
  });

  it("records an event when the state changes", () => {
    const orchestrator = new Orchestrator(createTask());

    orchestrator.transition("ANALYZING");

    const events = orchestrator.getEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("STATE_TRANSITION");
    expect(events[0]?.transition).toEqual({
      from: "TASK_CREATED",
      to: "ANALYZING",
    });
  });

  it("rejects an invalid transition", () => {
    const orchestrator = new Orchestrator(createTask());

    expect(() => orchestrator.transition("COMPLETE")).toThrow(
      "Invalid factory state transition: TASK_CREATED -> COMPLETE",
    );

    expect(orchestrator.getTask().status).toBe("TASK_CREATED");
    expect(orchestrator.getEvents()).toHaveLength(0);
  });
});