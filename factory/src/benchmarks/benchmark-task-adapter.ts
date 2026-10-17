import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  export interface BenchmarkTaskAdapterInput {
    scenario: BenchmarkScenario;
    runId: string;
    createdAt?: string;
  }
  
  export interface BenchmarkTaskClock {
    isoNow(): string;
  }
  
  const defaultClock:
    BenchmarkTaskClock = {
      isoNow() {
        return new Date().toISOString();
      },
    };
  
  function requireIdentifier(
    value: string,
    label: string,
  ): string {
    const trimmed =
      value.trim();
  
    if (!trimmed) {
      throw new Error(
        `${label} cannot be empty.`,
      );
    }
  
    return trimmed;
  }
  
  export class BenchmarkTaskAdapter {
    constructor(
      private readonly clock:
        BenchmarkTaskClock =
          defaultClock,
    ) {}
  
    create(
      input: BenchmarkTaskAdapterInput,
    ): EngineeringTask {
      const runId =
        requireIdentifier(
          input.runId,
          "Benchmark run ID",
        );
  
      const timestamp =
        input.createdAt ??
        this.clock.isoNow();
  
      return {
        id:
          `${input.scenario.id}-${runId}`,
  
        request:
          input.scenario.task,
  
        status:
          "TASK_CREATED",
  
        requirements:
          input.scenario
            .acceptanceCriteria
            .map(
              (criterion) =>
                criterion.description,
            ),
  
        acceptanceCriteria:
          input.scenario
            .acceptanceCriteria
            .map(
              (criterion) =>
                criterion.verification,
            ),
  
        constraints: [
          `Repository scope: ${input.scenario.repositoryFiles.join(", ")}`,
          `Expected complexity: ${input.scenario.expectedComplexity}`,
          `Expected risk: ${input.scenario.expectedRisk}`,
          ...input.scenario
            .validationCommands
            .map(
              (command) =>
                `Validation command: ${command}`,
            ),
        ],
  
        repairAttempts: 0,
  
        createdAt:
          timestamp,
  
        updatedAt:
          timestamp,
      };
    }
  }