import type {
    CandidateEvaluationResult,
  } from "./exploration-candidate-evaluator.js";
  import type {
    ExplorationImplementationResult,
  } from "./exploration-implementation-runner.js";
  import type {
    ExplorationValidationResult,
  } from "./exploration-implementation-validator.js";
  
  export interface ImplementationCandidateScore {
    candidateId: string;
    eligible: boolean;
    validationPassed: boolean;
    failedChecks: number;
    proposalScore: number;
    reasons: string[];
  }
  
  export interface ExplorationImplementationSelection {
    scores: ImplementationCandidateScore[];
    selectedCandidateId?: string;
    tiedCandidateIds: string[];
    requiresHumanSelection: boolean;
  }
  
  export class ExplorationImplementationSelector {
    select(
      implementations:
        ExplorationImplementationResult[],
      validations:
        ExplorationValidationResult[],
      candidateEvaluation:
        CandidateEvaluationResult,
    ): ExplorationImplementationSelection {
      const validationByCandidateId =
        new Map(
          validations.map((result) => [
            result.candidateId,
            result,
          ]),
        );
  
      const proposalScoreByCandidateId =
        new Map(
          candidateEvaluation.scores.map(
            (result) => [
              result.candidateId,
              result,
            ],
          ),
        );
  
      const scores =
        implementations.map(
          (
            implementation,
          ): ImplementationCandidateScore => {
            const candidateId =
              implementation.candidateId;
  
            const proposal =
              proposalScoreByCandidateId.get(
                candidateId,
              );
  
            const proposalScore =
              proposal?.eligible
                ? proposal.score
                : 0;
  
            if (
              implementation.status ===
              "error"
            ) {
              return {
                candidateId,
                eligible: false,
                validationPassed: false,
                failedChecks: 0,
                proposalScore,
                reasons: [
                  "Candidate implementation failed.",
                ],
              };
            }
  
            if (
              implementation.implementation
                .requiresHumanInput
            ) {
              return {
                candidateId,
                eligible: false,
                validationPassed: false,
                failedChecks: 0,
                proposalScore,
                reasons: [
                  "Candidate implementation requires human input.",
                ],
              };
            }
  
            const validation =
              validationByCandidateId.get(
                candidateId,
              );
  
            if (!validation) {
              return {
                candidateId,
                eligible: false,
                validationPassed: false,
                failedChecks: 0,
                proposalScore,
                reasons: [
                  "Candidate has no deterministic validation evidence.",
                ],
              };
            }
  
            if (
              validation.status !==
              "success"
            ) {
              return {
                candidateId,
                eligible: false,
                validationPassed: false,
                failedChecks: 0,
                proposalScore,
                reasons: [
                  validation.status ===
                  "error"
                    ? "Candidate validation encountered an infrastructure error."
                    : "Candidate validation was skipped.",
                ],
              };
            }
  
            const failedChecks =
              validation.validation
                .failedChecks.length;
  
            return {
              candidateId,
              eligible:
                validation.validation
                  .passed,
              validationPassed:
                validation.validation
                  .passed,
              failedChecks,
              proposalScore,
              reasons: [
                validation.validation
                  .passed
                  ? "Candidate passed deterministic validation."
                  : `Candidate failed ${failedChecks} deterministic validation check(s).`,
                `Proposal score is ${proposalScore}.`,
              ],
            };
          },
        );
  
      const eligible =
        scores.filter(
          (score) => score.eligible,
        );
  
      if (eligible.length === 0) {
        return {
          scores,
          tiedCandidateIds: [],
          requiresHumanSelection: true,
        };
      }
  
      const highestProposalScore =
        Math.max(
          ...eligible.map(
            (score) =>
              score.proposalScore,
          ),
        );
  
      const winners =
        eligible.filter(
          (score) =>
            score.proposalScore ===
            highestProposalScore,
        );
  
      if (winners.length !== 1) {
        return {
          scores,
          tiedCandidateIds:
            winners.map(
              (score) =>
                score.candidateId,
            ),
          requiresHumanSelection: true,
        };
      }
  
      const winner = winners[0];
  
      if (!winner) {
        return {
          scores,
          tiedCandidateIds: [],
          requiresHumanSelection: true,
        };
      }
  
      return {
        scores,
        selectedCandidateId:
          winner.candidateId,
        tiedCandidateIds: [],
        requiresHumanSelection: false,
      };
    }
  }