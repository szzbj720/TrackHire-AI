import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  export interface PullRequestEvidenceItem {
    requirement: string;
    implementation: string;
    verification: string;
  }
  
  export interface PullRequestBodyInput {
    task: EngineeringTask;
    validation: ValidationResult;
    evidence: PullRequestEvidenceItem[];
  }
  
  function renderValidation(
    validation: ValidationResult,
  ): string {
    if (
      validation.checks.length === 0
    ) {
      return "- No validation checks were recorded.";
    }
  
    return validation.checks
      .map((check) => {
        const status =
          check.passed
            ? "PASS"
            : "FAIL";
  
        return `- ${status}: \`${check.name}\``;
      })
      .join("\n");
  }
  
  function renderEvidence(
    evidence: PullRequestEvidenceItem[],
  ): string {
    if (
      evidence.length === 0
    ) {
      return "- No structured evidence was recorded.";
    }
  
    return evidence
      .map(
        (
          item,
          index,
        ) =>
          [
            `### ${index + 1}. ${item.requirement}`,
            "",
            `Implementation: ${item.implementation}`,
            "",
            `Verification: ${item.verification}`,
          ].join("\n"),
      )
      .join("\n\n");
  }
  
  export class PullRequestBodyBuilder {
    build(
      input: PullRequestBodyInput,
    ): string {
      const validationStatus =
        input.validation.passed
          ? "PASSED"
          : "FAILED";
  
      return [
        "## Summary",
        "",
        input.task.request,
        "",
        "## Task",
        "",
        `- ID: \`${input.task.id}\``,
        `- Status: \`${input.task.status}\``,
        "",
        "## Validation",
        "",
        `Overall status: **${validationStatus}**`,
        "",
        renderValidation(
          input.validation,
        ),
        "",
        "## Evidence",
        "",
        renderEvidence(
          input.evidence,
        ),
        "",
        "## Human review",
        "",
        "This pull request was created as a draft by the AI engineering factory.",
        "Final approval and merge remain human-controlled.",
      ].join("\n");
    }
  }