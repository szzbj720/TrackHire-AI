import { describe, expect, it } from "vitest";

import {
  canTransition,
  transitionState,
} from "./state-machine.js";

describe("factory state machine", () => {
  it("allows a valid transition", () => {
    expect(canTransition("TASK_CREATED", "ANALYZING")).toBe(true);
  });

  it("rejects an invalid transition", () => {
    expect(canTransition("IMPLEMENTING", "COMPLETE")).toBe(false);
  });

  it("transitions to the next state when valid", () => {
    expect(
      transitionState("TASK_CREATED", "ANALYZING"),
    ).toBe("ANALYZING");
  });

  it("throws when a transition is invalid", () => {
    expect(() =>
      transitionState("IMPLEMENTING", "COMPLETE"),
    ).toThrow(
      "Invalid factory state transition: IMPLEMENTING -> COMPLETE",
    );
  });

  it("does not allow transitions out of COMPLETE", () => {
    expect(canTransition("COMPLETE", "ANALYZING")).toBe(false);
  });

  it("does not allow transitions out of FAILED", () => {
    expect(canTransition("FAILED", "ANALYZING")).toBe(false);
  });

  it("allows a repair to return to validation", () => {
    expect(canTransition("REPAIRING", "VALIDATING")).toBe(true);
  });

  it("allows a rejected plan to return to planning", () => {
    expect(
      canTransition("AWAITING_PLAN_APPROVAL", "PLANNING"),
    ).toBe(true);
  });
});