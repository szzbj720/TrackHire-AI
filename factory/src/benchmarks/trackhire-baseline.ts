import type {
    BenchmarkCriterionResult,
  } from "./benchmark-acceptance-evaluator.js";
  
  import {
    BenchmarkFixtureManager,
  } from "./benchmark-fixture-manager.js";
  
  import type {
    BenchmarkScenario,
  } from "../schemas/benchmark-scenario.js";
  
  import type {
    BenchmarkWorkspace,
  } from "./benchmark-workspace-manager.js";
  
  import type {
    EngineeringTask,
  } from "../schemas/task.js";
  
  import {
    DeterministicAcceptanceCollector,
  } from "./deterministic-acceptance-collector.js";
  
  import {
    TrackHireInterviewDateVerifier,
    type BenchmarkCommandRunner,
  } from "./trackhire-interview-date-verifier.js";
  
  import {
    trackHireInterviewDateFixture,
  } from "./trackhire-interview-date-fixture.js";
  
  export interface TrackHireBaselineResult {
    scenarioId: string;
  
    workspacePath: string;
  
    criteria:
      BenchmarkCriterionResult[];
  
    passedCriteria: number;
  
    failedCriteria: number;
  
    passed: boolean;
  }
  
  export class TrackHireBaseline {
    constructor(
      private readonly fixtureManager =
        new BenchmarkFixtureManager(),
  
      private readonly commandRunner?:
        BenchmarkCommandRunner,
    ) {}
  
    async run(input: {
      scenario: BenchmarkScenario;
  
      workspace: BenchmarkWorkspace;
  
      task: EngineeringTask;
    }): Promise<TrackHireBaselineResult> {
      const fixtures = [
        trackHireInterviewDateFixture,
      ];
  
      const installedFixtures =
        await this.fixtureManager.install(
          input.workspace,
          fixtures,
        );
  
      const verifier =
        new TrackHireInterviewDateVerifier(
          this.commandRunner,
        );
  
      const collector =
        new DeterministicAcceptanceCollector(
          verifier,
        );
  
      const criteria =
        await collector.collect({
          scenario:
            input.scenario,
  
          workspace:
            input.workspace,
  
          task:
            input.task,
        });
  
      await this.fixtureManager
        .assertUnchanged(
          input.workspace,
          installedFixtures,
        );
  
      const passedCriteria =
        criteria.filter(
          (criterion) =>
            criterion.passed,
        ).length;
  
      const failedCriteria =
        criteria.length -
        passedCriteria;
  
      return {
        scenarioId:
          input.scenario.id,
  
        workspacePath:
          input.workspace.path,
  
        criteria,
  
        passedCriteria,
  
        failedCriteria,
  
        passed:
          failedCriteria === 0,
      };
    }
  }