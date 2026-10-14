import {
    failureDiagnosisSchema,
    type FailureDiagnosis,
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
  import type {
    ModelProvider,
  } from "../models/provider.js";
  
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
  
  export class ModelDiagnostician
    implements Diagnostician
  {
    constructor(
      private readonly provider: ModelProvider,
    ) {}
  
    async diagnose(
      input: DiagnosticianInput,
    ): Promise<FailureDiagnosis> {
      if (input.validation.passed) {
        throw new Error(
          "Cannot diagnose a successful validation result.",
        );
      }
  
      const response =
        await this.provider.generate({
          systemPrompt: [
            "You are a software engineering failure diagnostician.",
            "Determine why an implementation failed deterministic validation.",
            "Use the supplied task, approved plan, implementation result, validation evidence, and relevant files.",
            "Do not modify code.",
            "Do not claim evidence that is not present in the supplied context.",
            "Classify the failure using one of the allowed failure categories.",
            "Set requiresHumanInput to true when requirements are ambiguous, evidence is insufficient, or a safe repair cannot be determined.",
            "Return only valid JSON matching the requested FailureDiagnosis structure.",
          ].join(" "),
  
          userPrompt: JSON.stringify({
            task: {
              request: input.task.request,
              requirements:
                input.task.requirements,
              acceptanceCriteria:
                input.task.acceptanceCriteria,
              constraints:
                input.task.constraints,
            },
            plan: input.plan,
            implementation:
              input.implementation,
            validation: input.validation,
            relevantFiles:
              input.relevantFiles,
          }),
        });
  
      const parsed: unknown = JSON.parse(
        response.content,
      );
  
      return failureDiagnosisSchema.parse(
        parsed,
      );
    }
  }