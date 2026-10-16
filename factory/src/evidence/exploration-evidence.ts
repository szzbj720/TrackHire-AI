import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    ExplorationMetrics,
  } from "../schemas/exploration-metrics.js";
  import type {
    ExplorationImplementationResult,
  } from "../models/exploration-implementation-runner.js";
  import type {
    ExplorationImplementationSelection,
  } from "../models/exploration-implementation-selector.js";
  import type {
    ExplorationValidationResult,
  } from "../models/exploration-implementation-validator.js";
  
  export interface ExplorationEvidence {
    candidates: ExplorationCandidate[];
  
    implementations:
      ExplorationImplementationResult[];
  
    validations:
      ExplorationValidationResult[];
  
    selection:
      ExplorationImplementationSelection;
  
    metrics: ExplorationMetrics;
  }
  
  export function createExplorationEvidence(
    input: ExplorationEvidence,
  ): ExplorationEvidence {
    return {
      candidates: input.candidates,
      implementations:
        input.implementations,
      validations: input.validations,
      selection: input.selection,
      metrics: input.metrics,
    };
  }