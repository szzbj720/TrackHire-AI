import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  
  export type CandidateValidationFailure =
    | "REQUIRES_HUMAN_INPUT"
    | "NO_AFFECTED_FILES"
    | "UNKNOWN_AFFECTED_FILE"
    | "DUPLICATE_CANDIDATE_ID";
  
  export interface CandidateValidationIssue {
    code: CandidateValidationFailure;
    message: string;
  }
  
  export interface CandidateValidationResult {
    candidateId: string;
    valid: boolean;
    issues: CandidateValidationIssue[];
  }
  
  export interface ExplorationCandidateValidationResult {
    results: CandidateValidationResult[];
  }
  
  export class ExplorationCandidateValidator {
    validate(
      candidates: ExplorationCandidate[],
      repositoryFiles: string[],
    ): ExplorationCandidateValidationResult {
      const candidateIdCounts =
        this.countCandidateIds(candidates);
  
      const repositoryFileSet =
        new Set(repositoryFiles);
  
      const results = candidates.map(
        (candidate):
          CandidateValidationResult => {
          const issues:
            CandidateValidationIssue[] = [];
  
          if (
            candidate.requiresHumanInput
          ) {
            issues.push({
              code:
                "REQUIRES_HUMAN_INPUT",
              message:
                "Candidate requires human clarification before implementation.",
            });
          }
  
          if (
            candidate.affectedFiles
              .length === 0
          ) {
            issues.push({
              code:
                "NO_AFFECTED_FILES",
              message:
                "Candidate does not identify any affected repository files.",
            });
          }
  
          for (
            const file
            of candidate.affectedFiles
          ) {
            if (
              !repositoryFileSet.has(
                file,
              )
            ) {
              issues.push({
                code:
                  "UNKNOWN_AFFECTED_FILE",
                message:
                  `Candidate references unknown repository file: ${file}`,
              });
            }
          }
  
          if (
            (
              candidateIdCounts.get(
                candidate.candidateId,
              ) ?? 0
            ) > 1
          ) {
            issues.push({
              code:
                "DUPLICATE_CANDIDATE_ID",
              message:
                `Candidate ID is not unique: ${candidate.candidateId}`,
            });
          }
  
          return {
            candidateId:
              candidate.candidateId,
            valid: issues.length === 0,
            issues,
          };
        },
      );
  
      return { results };
    }
  
    private countCandidateIds(
      candidates: ExplorationCandidate[],
    ): Map<string, number> {
      const counts =
        new Map<string, number>();
  
      for (const candidate of candidates) {
        counts.set(
          candidate.candidateId,
          (
            counts.get(
              candidate.candidateId,
            ) ?? 0
          ) + 1,
        );
      }
  
      return counts;
    }
  }