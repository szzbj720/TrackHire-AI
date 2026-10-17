import {
    mkdtemp,
    readFile,
    rm,
    writeFile,
  } from "node:fs/promises";
  
  import {
    tmpdir,
  } from "node:os";
  
  import {
    join,
  } from "node:path";
  
  import {
    afterEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    ModelBuilder,
  } from "../agents/builder.js";
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  import type {
    ImplementationPlan,
  } from "../schemas/plan.js";
  
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  
  import type {
    Validator,
  } from "../validation/validator.js";
  
  import {
    BenchmarkModelProvider,
  } from "./benchmark-model-provider.js";
  
  import {
    DeterministicCodeChangeProvider,
  } from "./deterministic-code-change-provider.js";
  
  import type {
    BenchmarkAcceptanceCollector,
  } from "./sequential-benchmark-executor.js";
  
  import {
    SequentialBenchmarkExecutor,
  } from "./sequential-benchmark-executor.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  class PassingValidator
    implements Validator {
    workspacePaths:
      string[] = [];
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      this.workspacePaths.push(
        worktreePath,
      );
  
      return {
        passed: true,
  
        checks: [
          {
            name:
              "deterministic validation",
  
            command:
              "test",
  
            args: [],
  
            exitCode: 0,
  
            stdout:
              "validation passed",
  
            stderr: "",
  
            durationMs: 1,
  
            passed: true,
          },
        ],
  
        failedChecks: [],
  
        durationMs: 1,
      };
    }
  }
  
  class PassingAcceptanceCollector
    implements BenchmarkAcceptanceCollector {
    async collect(
      input: Parameters<
        BenchmarkAcceptanceCollector["collect"]
      >[0],
    ) {
      return input.scenario
        .acceptanceCriteria
        .map(
          (criterion) => ({
            criterionId:
              criterion.id,
  
            passed: true,
  
            evidence: [
              `Verified ${criterion.id}`,
            ],
          }),
        );
    }
  }
  
  function createPlan():
    ImplementationPlan {
    return {
      summary:
        "Update the benchmark fixture file.",
  
      steps: [
        {
          order: 1,
  
          description:
            "Update the approved file.",
  
          files: [
            "fixture.txt",
          ],
  
          rationale:
            "Exercise the real model builder path.",
        },
      ],
  
      affectedFiles: [
        "fixture.txt",
      ],
  
      validationSteps: [
        "deterministic validation",
      ],
  
      risks: [],
  
      assumptions: [],
  
      requiresHumanInput: false,
    };
  }
  
  describe(
    "sequential model benchmark integration",
    () => {
      const temporaryDirectories:
        string[] = [];
  
      afterEach(
        async () => {
          await Promise.all(
            temporaryDirectories
              .splice(0)
              .map(
                async (directory) => {
                  await rm(
                    directory,
                    {
                      recursive: true,
                      force: true,
                    },
                  );
                },
              ),
          );
        },
      );
  
      it(
        "connects provider, model evidence, builder, workflow, validation, and benchmark execution",
        async () => {
          const workspacePath =
            await mkdtemp(
              join(
                tmpdir(),
                "factory-sequential-model-",
              ),
            );
  
          temporaryDirectories.push(
            workspacePath,
          );
  
          await writeFile(
            join(
              workspacePath,
              "fixture.txt",
            ),
            "before\n",
            "utf8",
          );
  
          const deterministicProvider =
            new DeterministicCodeChangeProvider({
              model:
                "deterministic-integration-coder",
  
              changeSet: {
                summary:
                  "Updated the approved fixture.",
  
                writes: [
                  {
                    path:
                      "fixture.txt",
  
                    content:
                      "after\n",
  
                    summary:
                      "Changed the fixture contents.",
                  },
                ],
  
                assumptions: [],
  
                warnings: [],
  
                requiresHumanInput: false,
              },
  
              inputTokens: 321,
  
              outputTokens: 123,
  
              estimatedCostUsd: 0,
            });
  
          const benchmarkProvider =
            new BenchmarkModelProvider(
              deterministicProvider,
            );
  
          const builder =
            new ModelBuilder(
              benchmarkProvider,
            );
  
          const validator =
            new PassingValidator();
  
          const workflow =
            new ImplementationWorkflow(
              builder,
              validator,
            );
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "integration-sequential",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                workflow,
  
              acceptanceCollector:
                new PassingAcceptanceCollector(),
  
              modelEvidence:
                benchmarkProvider,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace: {
                scenarioId:
                  "trackhire-interview-date",
  
                runId:
                  "integration-sequential",
  
                strategyId:
                  "sequential",
  
                baselineRevision:
                  "integration-baseline",
  
                path:
                  workspacePath,
  
                branch:
                  "factory/integration-sequential",
              },
            });
  
          const updatedContents =
            await readFile(
              join(
                workspacePath,
                "fixture.txt",
              ),
              "utf8",
            );
  
          expect(
            updatedContents,
          ).toBe(
            "after\n",
          );
  
          expect(
            deterministicProvider
              .requests,
          ).toHaveLength(1);
  
          expect(
            validator.workspacePaths,
          ).toEqual([
            workspacePath,
          ]);
  
          expect(
            result.criterionResults,
          ).toHaveLength(
            trackHireInterviewDateBenchmark
              .acceptanceCriteria
              .length,
          );
  
          expect(
            result.usage,
          ).toEqual({
            inputTokens: 321,
            outputTokens: 123,
            estimatedCostUsd: 0,
          });
  
          expect(
            result.humanInterventions,
          ).toBe(1);
  
          const evidence =
            benchmarkProvider
              .snapshot();
  
          expect(
            evidence.successfulCalls,
          ).toBe(1);
  
          expect(
            evidence.failedCalls,
          ).toBe(0);
  
          expect(
            evidence.inputTokens,
          ).toBe(321);
  
          expect(
            evidence.outputTokens,
          ).toBe(123);
  
          expect(
            evidence.estimatedCostUsd,
          ).toBe(0);
  
          expect(
            evidence.calls[0]?.model,
          ).toBe(
            "deterministic-integration-coder",
          );
        },
      );
    },
  );