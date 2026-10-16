export interface ModelReviewJudgment {
    targetId: string;
    model: string;
    approved: boolean;
    requiresHumanInput: boolean;
    confidence: number;
  }
  
  export type DisagreementReason =
    | "approval"
    | "human-input";
  
  export interface ModelDisagreement {
    disagreed: boolean;
    reasons: DisagreementReason[];
    judgments: ModelReviewJudgment[];
  }
  
  export function evaluateModelDisagreement(
    judgments: ModelReviewJudgment[],
  ): ModelDisagreement {
    if (judgments.length < 2) {
      return {
        disagreed: false,
        reasons: [],
        judgments: [...judgments],
      };
    }
  
    const reasons: DisagreementReason[] =
      [];
  
    const approvalValues =
      new Set(
        judgments.map(
          (judgment) =>
            judgment.approved,
        ),
      );
  
    if (approvalValues.size > 1) {
      reasons.push("approval");
    }
  
    const humanInputValues =
      new Set(
        judgments.map(
          (judgment) =>
            judgment.requiresHumanInput,
        ),
      );
  
    if (humanInputValues.size > 1) {
      reasons.push("human-input");
    }
  
    return {
      disagreed: reasons.length > 0,
      reasons,
      judgments: [...judgments],
    };
  }