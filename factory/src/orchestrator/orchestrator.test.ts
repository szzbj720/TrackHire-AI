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

    expect(() =>
      orchestrator.transition("COMPLETE"),
    ).toThrow(
      "Invalid factory state transition: TASK_CREATED -> COMPLETE",
    );

    expect(orchestrator.getTask().status).toBe(
      "TASK_CREATED",
    );
    expect(orchestrator.getEvents()).toHaveLength(0);
  });

  it("stores task analysis", () => {
    const orchestrator = new Orchestrator(createTask());

    const analysis = {
      complexity: "medium" as const,
      risk: "medium" as const,
      affectedAreas: ["application model"],
      relevantFiles: [
        "lib/models/job_application.dart",
      ],
      ambiguities: [],
      assumptions: [
        "Interview date is optional.",
      ],
      confidence: 0.9,
      requiresHumanInput: false,
      reasoning:
        "The task changes application data.",
    };

    orchestrator.setAnalysis(analysis);

    expect(orchestrator.getTask().analysis).toEqual(
      analysis,
    );
  });

  it("stores an implementation plan", () => {
    const orchestrator = new Orchestrator(createTask());

    const plan = {
      summary: "Add interview date support.",
      steps: [
        {
          order: 1,
          description:
            "Update the application model.",
          files: [
            "lib/models/job_application.dart",
          ],
          rationale:
            "The model needs to represent the interview date.",
        },
      ],
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
      validationSteps: [
        "Run Flutter tests.",
      ],
      risks: [],
      assumptions: [
        "Interview date is optional.",
      ],
      requiresHumanInput: false,
    };

    orchestrator.setPlan(plan);

    expect(orchestrator.getTask().plan).toEqual(plan);
  });

  it("allows a human to approve a plan", () => {
    const orchestrator = new Orchestrator(createTask());

    orchestrator.transition("ANALYZING");
    orchestrator.transition("PLANNING");
    orchestrator.transition(
      "AWAITING_PLAN_APPROVAL",
    );

    orchestrator.approvePlan();

    expect(orchestrator.getTask().status).toBe(
      "IMPLEMENTING",
    );

    expect(
      orchestrator
        .getEvents()
        .some(
          (event) =>
            event.type ===
            "HUMAN_APPROVAL_RECEIVED",
        ),
    ).toBe(true);
  });

  it("allows a human to reject a plan and return to planning", () => {
    const orchestrator = new Orchestrator(createTask());

    orchestrator.transition("ANALYZING");
    orchestrator.transition("PLANNING");
    orchestrator.transition(
      "AWAITING_PLAN_APPROVAL",
    );

    orchestrator.rejectPlan();

    expect(orchestrator.getTask().status).toBe(
      "PLANNING",
    );
  });

  it("rejects plan approval outside the approval state", () => {
    const orchestrator = new Orchestrator(createTask());

    expect(() => orchestrator.approvePlan()).toThrow(
      "Cannot approve plan while task is in state TASK_CREATED",
    );

    expect(orchestrator.getTask().status).toBe(
      "TASK_CREATED",
    );
  });

  it("allows a human to approve the final implementation", () => {
    const task = createTask();

    task.status = "AWAITING_FINAL_APPROVAL";

    const orchestrator = new Orchestrator(task);

    orchestrator.approveFinal();

    expect(orchestrator.getTask().status).toBe(
      "COMPLETE",
    );

    const events = orchestrator.getEvents();

    expect(
      events.some(
        (event) =>
          event.type ===
            "HUMAN_APPROVAL_RECEIVED" &&
          event.stage === "COMPLETE",
      ),
    ).toBe(true);
  });

  it("allows a human to reject the final implementation", () => {
    const task = createTask();

    task.status = "AWAITING_FINAL_APPROVAL";

    const orchestrator = new Orchestrator(task);

    orchestrator.rejectFinal();

    expect(orchestrator.getTask().status).toBe(
      "FAILED",
    );

    const events = orchestrator.getEvents();

    expect(
      events.some(
        (event) =>
          event.type ===
            "HUMAN_APPROVAL_RECEIVED" &&
          event.stage === "FAILED",
      ),
    ).toBe(true);
  });

  it("rejects final approval outside the final approval state", () => {
    const orchestrator = new Orchestrator(createTask());

    expect(() =>
      orchestrator.approveFinal(),
    ).toThrow(
      "Cannot approve final result while task is in state TASK_CREATED",
    );

    expect(orchestrator.getTask().status).toBe(
      "TASK_CREATED",
    );
  });

  it("rejects final rejection outside the final approval state", () => {
    const orchestrator = new Orchestrator(createTask());

    expect(() =>
      orchestrator.rejectFinal(),
    ).toThrow(
      "Cannot reject final result while task is in state TASK_CREATED",
    );

    expect(orchestrator.getTask().status).toBe(
      "TASK_CREATED",
    );
  });
});