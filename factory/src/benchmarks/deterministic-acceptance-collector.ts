import type {
    BenchmarkCriterionResult,
  } from "./benchmark-acceptance-evaluator.js";
  
  import type {
    BenchmarkAcceptanceCollector,
  } from "./sequential-benchmark-executor.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  export interface BenchmarkCriterionVerification {
    criterionId: string;
    passed: boolean;
    evidence: string[];
  }
  
  export interface BenchmarkCriterionVerifier {
    verify(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
      task: EngineeringTask;
    }): Promise<BenchmarkCriterionVerification[]>;
  }
  
  function assertUniqueCriterionIds(
    verifications:
      BenchmarkCriterionVerification[],
  ): void {
    const seen =
      new Set<string>();
  
    for (
      const verification
      of verifications
    ) {
      if (
        seen.has(
          verification.criterionId,
        )
      ) {
        throw new Error(
          `Duplicate benchmark criterion verification: ${verification.criterionId}`,
        );
      }
  
      seen.add(
        verification.criterionId,
      );
    }
  }
  
  export class DeterministicAcceptanceCollector
    implements BenchmarkAcceptanceCollector {
    constructor(
      private readonly verifier:
        BenchmarkCriterionVerifier,
    ) {}
  
    async collect(input: {
      scenario: BenchmarkScenario;
      workspace: BenchmarkWorkspace;
      task: EngineeringTask;
    }): Promise<
      BenchmarkCriterionResult[]
    > {
      const verifications =
        await this.verifier.verify(
          input,
        );
  
      assertUniqueCriterionIds(
        verifications,
      );
  
      const byCriterionId =
        new Map(
          verifications.map(
            (verification) => [
              verification.criterionId,
              verification,
            ],
          ),
        );
  
      return input.scenario
        .acceptanceCriteria
        .map(
          (criterion) => {
            const verification =
              byCriterionId.get(
                criterion.id,
              );
  
            if (!verification) {
              return {
                criterionId:
                  criterion.id,
  
                passed:
                  false,
  
                evidence: [
                  "No deterministic acceptance evidence was produced.",
                ],
              };
            }
  
            return {
              criterionId:
                criterion.id,
  
              passed:
                verification.passed,
  
              evidence: [
                ...verification.evidence,
              ],
            };
          },
        );
    }
  }