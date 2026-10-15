import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  import {
    changeEvidenceSchema,
    type ChangeEvidence,
  } from "../schemas/change-evidence.js";
  import type {
    GitDiffEvidence,
  } from "../tools/git-diff.js";
  
  export function buildChangeEvidence(
    plan: ImplementationPlan,
    implementation: ImplementationResult,
    gitDiff: GitDiffEvidence,
  ): ChangeEvidence {
    const approvedFiles = uniqueSorted(
      plan.affectedFiles,
    );
  
    const reportedFiles = uniqueSorted(
      implementation.changedFiles.map(
        (change) => change.path,
      ),
    );
  
    const observedFiles = uniqueSorted(
      gitDiff.changedFiles,
    );
  
    const approvedSet = new Set(
      approvedFiles,
    );
  
    const reportedSet = new Set(
      reportedFiles,
    );
  
    const observedSet = new Set(
      observedFiles,
    );
  
    const unreportedFiles =
      observedFiles.filter(
        (file) => !reportedSet.has(file),
      );
  
    const missingReportedFiles =
      reportedFiles.filter(
        (file) => !observedSet.has(file),
      );
  
    const unapprovedFiles =
      observedFiles.filter(
        (file) => !approvedSet.has(file),
      );
  
    return changeEvidenceSchema.parse({
      approvedFiles,
      reportedFiles,
      observedFiles,
      unreportedFiles,
      missingReportedFiles,
      unapprovedFiles,
      withinApprovedScope:
        unapprovedFiles.length === 0,
      reportMatchesObserved:
        unreportedFiles.length === 0 &&
        missingReportedFiles.length === 0,
      patch: gitDiff.patch,
    });
  }
  
  function uniqueSorted(
    values: string[],
  ): string[] {
    return [
      ...new Set(values),
    ].sort();
  }