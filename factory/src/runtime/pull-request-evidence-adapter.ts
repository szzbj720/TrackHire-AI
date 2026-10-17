import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    PullRequestEvidenceItem,
  } from "../github/pull-request-body-builder.js";
  
  function joinOrFallback(
    values: string[],
    fallback: string,
  ): string {
    if (
      values.length === 0
    ) {
      return fallback;
    }
  
    return values.join("; ");
  }
  
  export function buildPullRequestEvidence(
    result: AdaptiveFactoryResult,
  ): PullRequestEvidenceItem[] {
    const run =
      result.run;
  
    const implementation =
      run.implementation;
  
    const review =
      run.review;
  
    const validation =
      run.validation;
  
    if (
      !implementation ||
      !validation
    ) {
      return [];
    }
  
    const changedFiles =
      implementation.changedFiles.map(
        (change) =>
          `${change.path}: ${change.summary}`,
      );
  
    const validationChecks =
      validation.checks.map(
        (check) =>
          `${check.passed ? "PASS" : "FAIL"} ${check.name}`,
      );
  
    if (
      review &&
      review.requirementCoverage.length > 0
    ) {
      return review.requirementCoverage.map(
        (coverage) => ({
          requirement:
            coverage.requirement,
  
          implementation:
            joinOrFallback(
              changedFiles,
              implementation.summary,
            ),
  
          verification:
            joinOrFallback(
              coverage.evidence,
              joinOrFallback(
                validationChecks,
                "Validation completed.",
              ),
            ),
        }),
      );
    }
  
    return run.task.acceptanceCriteria.map(
      (criterion) => ({
        requirement:
          criterion,
  
        implementation:
          joinOrFallback(
            changedFiles,
            implementation.summary,
          ),
  
        verification:
          joinOrFallback(
            validationChecks,
            "Validation completed.",
          ),
      }),
    );
  }