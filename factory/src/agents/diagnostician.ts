import type {
    FailureDiagnosis,
  } from "../schemas/diagnosis.js";
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  export interface DiagnosticianInput {
    task: EngineeringTask;
    plan: ImplementationPlan;
    implementation: ImplementationResult;
    validation: ValidationResult;
    relevantFiles: Array<{
      path: string;
      content: string;
    }>;
  }
  
  export interface Diagnostician {
    diagnose(
      input: DiagnosticianInput,
    ): Promise<FailureDiagnosis>;
  }