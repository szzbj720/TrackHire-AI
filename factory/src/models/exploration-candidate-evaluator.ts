import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import type {
    CandidateValidationResult,
  } from "./exploration-candidate-validator.js";
  
  export interface CandidateScore {
    candidateId: string;
    eligible: boolean;
    score: number;
    reasons: string[];
  }
  
  export interface CandidateEvaluationResult {
    scores: CandidateScore[];
    selectedCandidateId?: string;
    tiedCandidateIds: string[];
    requiresHumanSelection: boolean;
  }
  
  export class ExplorationCandidateEvaluator {
    evaluate(
      candidates: ExplorationCandidate[],
      validationResults:
        CandidateValidationResult[],
    ): CandidateEvaluationResult {
      const validationByCandidateId =
        new Map(
          validationResults.map(
            (result) => [
              result.candidateId,
              result,
            ],
          ),
        );
  
      const scores = candidates.map(
        (candidate):
          CandidateScore => {
          const validation =
            validationByCandidateId.get(
              candidate.candidateId,
            );
  
          if (!validation) {
            return {
              candidateId:
                candidate.candidateId,
              eligible: false,
              score: 0,
              reasons: [
                "Candidate has no deterministic validation result.",
              ],
            };
          }
  
          if (!validation.valid) {
            return {
              candidateId:
                candidate.candidateId,
              eligible: false,
              score: 0,
              reasons: [
                `Candidate failed ${validation.issues.length} deterministic validation check(s).`,
              ],
            };
          }
  
          const reasons: string[] = [];
  
          let score =
            candidate.confidence * 100;
  
          reasons.push(
            `Confidence contributes ${candidate.confidence * 100} points.`,
          );
  
          const filePenalty =
            candidate.affectedFiles.length *
            5;
  
          score -= filePenalty;
  
          reasons.push(
            `Affected file scope subtracts ${filePenalty} points.`,
          );
  
          const riskPenalty =
            candidate.risks.length * 5;
  
          score -= riskPenalty;
  
          reasons.push(
            `Declared risks subtract ${riskPenalty} points.`,
          );
  
          const assumptionPenalty =
            candidate.assumptions.length *
            3;
  
          score -= assumptionPenalty;
  
          reasons.push(
            `Assumptions subtract ${assumptionPenalty} points.`,
          );
  
          return {
            candidateId:
              candidate.candidateId,
            eligible: true,
            score,
            reasons,
          };
        },
      );
  
      const eligibleScores =
        scores.filter(
          (score) => score.eligible,
        );
  
      if (eligibleScores.length === 0) {
        return {
          scores,
          tiedCandidateIds: [],
          requiresHumanSelection: true,
        };
      }
  
      const highestScore = Math.max(
        ...eligibleScores.map(
          (candidate) =>
            candidate.score,
        ),
      );
  
      const winners =
        eligibleScores.filter(
          (candidate) =>
            candidate.score ===
            highestScore,
        );
  
      if (winners.length > 1) {
        return {
          scores,
          tiedCandidateIds:
            winners.map(
              (candidate) =>
                candidate.candidateId,
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