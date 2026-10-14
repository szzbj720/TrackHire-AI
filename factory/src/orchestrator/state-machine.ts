import type { FactoryState } from "../schemas/task.js";

const allowedTransitions: Record<FactoryState, FactoryState[]> = {
  TASK_CREATED: ["ANALYZING", "FAILED"],

  ANALYZING: ["PLANNING", "NEEDS_HUMAN", "FAILED"],

  PLANNING: ["AWAITING_PLAN_APPROVAL", "NEEDS_HUMAN", "FAILED"],

  AWAITING_PLAN_APPROVAL: ["IMPLEMENTING", "PLANNING", "FAILED"],

  IMPLEMENTING: ["VALIDATING", "NEEDS_HUMAN", "FAILED"],

  VALIDATING: ["REVIEWING", "DIAGNOSING_FAILURE", "FAILED"],

  DIAGNOSING_FAILURE: ["REPAIRING", "NEEDS_HUMAN", "FAILED"],

  REPAIRING: ["VALIDATING", "NEEDS_HUMAN", "FAILED"],

  REVIEWING: [
    "AWAITING_FINAL_APPROVAL",
    "REPAIRING",
    "NEEDS_HUMAN",
    "FAILED",
  ],

  AWAITING_FINAL_APPROVAL: ["COMPLETE", "REPAIRING", "FAILED"],

  NEEDS_HUMAN: [
    "ANALYZING",
    "PLANNING",
    "IMPLEMENTING",
    "REPAIRING",
    "REVIEWING",
    "FAILED",
  ],

  COMPLETE: [],

  FAILED: [],
};

export function canTransition(
  from: FactoryState,
  to: FactoryState,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionState(
  currentState: FactoryState,
  nextState: FactoryState,
): FactoryState {
  if (!canTransition(currentState, nextState)) {
    throw new Error(
      `Invalid factory state transition: ${currentState} -> ${nextState}`,
    );
  }

  return nextState;
}