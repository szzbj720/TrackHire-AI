import {
    mkdtemp,
    mkdir,
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
  
  import type {
    Builder,
    BuilderInput,
  } from "../agents/builder.js";
  
  import {
    ModelDiagnostician,
  } from "../agents/diagnostician.js";
  
  import {
    ModelRepairer,
  } from "../agents/repairer.js";
  
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  
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
    DiagnosisWorkflow,
  } from "../orchestrator/diagnosis-workflow.js";
  
  import {
    ImplementationWorkflow,
  } from "../orchestrator/implementation-workflow.js";
  
  import {
    RepairWorkflow,
  } from "../orchestrator/repair-workflow.js";
  
  import {
    DeterministicCodeChangeProvider,
  } from "./deterministic-code-change-provider.js";
  
  import {
    DeterministicDiagnosisProvider,
  } from "./deterministic-diagnosis-provider.js";
  
  import type {
    BenchmarkAcceptanceCollector,
  } from "./sequential-benchmark-executor.js";
  
  import {
    SequentialBenchmarkExecutor,
  } from "./sequential-benchmark-executor.js";
  
  import {
    trackHireInterviewDateBenchmark,
  } from "./trackhire-interview-date.js";
  
  class FailingBuilder
    implements Builder {
    worktreePaths: string[] = [];
  
    async implement(
      input: BuilderInput,
    ): Promise<ImplementationResult> {
      this.worktreePaths.push(
        input.worktreePath,
      );
  
      return {
        summary:
          "Created an implementation with a known validation failure.",
  
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
  
            changeType:
              "modified",
  
            summary:
              "Added a deliberately incomplete interview date implementation.",
          },
        ],
  
        commandsRun: [],
  
        assumptions: [],
  
        warnings: [],
  
        requiresHumanInput:
          false,
      };
    }
  }
  
  class FailThenPassValidator
    implements Validator {
    calls = 0;
  
    worktreePaths: string[] = [];
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      this.calls += 1;
  
      this.worktreePaths.push(
        worktreePath,
      );
  
      if (this.calls === 1) {
        return {
          passed: false,
  
          checks: [
            {
              name:
                "Flutter analyze",
  
              command:
                "flutter",
  
              args: [
                "analyze",
              ],
  
              exitCode: 1,
  
              stdout: "",
  
              stderr:
                "A nullable interview date was used without a null check.",
  
              durationMs: 10,
  
              passed: false,
            },
          ],
  
          failedChecks: [
            "Flutter analyze",
          ],
  
          durationMs: 10,
        };
      }
  
      return {
        passed: true,
  
        checks: [
          {
            name:
              "Flutter analyze",
  
            command:
              "flutter",
  
            args: [
              "analyze",
            ],
  
            exitCode: 0,
  
            stdout:
              "No issues found.",
  
            stderr: "",
  
            durationMs: 10,
  
            passed: true,
          },
        ],
  
        failedChecks: [],
  
        durationMs: 10,
      };
    }
  }
  
  class PassingAcceptanceCollector
    implements BenchmarkAcceptanceCollector {
    async collect(input: Parameters<
      BenchmarkAcceptanceCollector["collect"]
    >[0]) {
      return input.scenario
        .acceptanceCriteria
        .map(
          (criterion) => ({
            criterionId:
              criterion.id,
  
            passed: true,
  
            evidence: [
              `Verified ${criterion.id} after recovery.`,
            ],
          }),
        );
    }
  }
  
  function createPlan():
    ImplementationPlan {
    return {
      summary:
        "Add optional interview date support.",
  
      steps: [
        {
          order: 1,
  
          description:
            "Update the application model.",
  
          files: [
            "lib/models/job_application.dart",
          ],
  
          rationale:
            "The model must store the interview date.",
        },
      ],
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      validationSteps: [
        "flutter analyze",
      ],
  
      risks: [
        "Nullable dates must be handled safely.",
      ],
  
      assumptions: [
        "Interview dates are optional.",
      ],
  
      requiresHumanInput:
        false,
    };
  }
  
  describe(
    "Sequential recovery benchmark",
    () => {
      const temporaryDirectories:
        string[] = [];
  
      afterEach(
        async () => {
          for (
            const directory
            of temporaryDirectories.splice(0)
          ) {
            await rm(
              directory,
              {
                recursive: true,
                force: true,
              },
            );
          }
        },
      );
  
      it(
        "diagnoses, repairs, and revalidates a failed implementation",
        async () => {
          const workspacePath =
            await mkdtemp(
              join(
                tmpdir(),
                "benchmark-recovery-",
              ),
            );
  
          temporaryDirectories.push(
            workspacePath,
          );
  
          const modelDirectory =
            join(
              workspacePath,
              "lib",
              "models",
            );
  
          await mkdir(
            modelDirectory,
            {
              recursive: true,
            },
          );
  
          const modelPath =
            join(
              modelDirectory,
              "job_application.dart",
            );
  
          await writeFile(
            modelPath,
            [
              "class JobApplication {",
              "  final DateTime? interviewDate;",
              "}",
              "",
            ].join("\n"),
            "utf8",
          );
  
          const workspace = {
            scenarioId:
              "trackhire-interview-date",
  
            runId:
              "recovery-test",
  
            strategyId:
              "sequential",
  
            baselineRevision:
              "abc123",
  
            path:
              workspacePath,
  
            branch:
              "factory/benchmark-recovery",
          };
  
          const builder =
            new FailingBuilder();
  
          const validator =
            new FailThenPassValidator();
  
          const diagnosisProvider =
            new DeterministicDiagnosisProvider({
              diagnosis: {
                category:
                  "STATIC_ANALYSIS",
  
                summary:
                  "The implementation does not safely handle a nullable interview date.",
  
                evidence: [
                  "Flutter analyze reports a nullable interview date used without a null check.",
                ],
  
                suspectedFiles: [
                  "lib/models/job_application.dart",
                ],
  
                recommendedAction:
                  "Add safe nullable handling for the interview date.",
  
                repairable:
                  true,
  
                confidence:
                  0.95,
  
                requiresHumanInput:
                  false,
              },
            });
  
          const repairProvider =
            new DeterministicCodeChangeProvider({
              changeSet: {
                summary:
                  "Added safe nullable interview date handling.",
  
                writes: [
                  {
                    path:
                      "lib/models/job_application.dart",
  
                    content: [
                      "class JobApplication {",
                      "  final DateTime? interviewDate;",
                      "",
                      "  String? get interviewDateIso =>",
                      "      interviewDate?.toIso8601String();",
                      "}",
                      "",
                    ].join("\n"),
  
                    summary:
                      "Handled the nullable interview date safely.",
                  },
                ],
  
                assumptions: [],
  
                warnings: [],
  
                requiresHumanInput:
                  false,
              },
            });
  
          const implementationWorkflow =
            new ImplementationWorkflow(
              builder,
              validator,
            );
  
          const diagnosisWorkflow =
            new DiagnosisWorkflow(
              new ModelDiagnostician(
                diagnosisProvider,
              ),
            );
  
          const repairWorkflow =
            new RepairWorkflow(
              new ModelRepairer(
                repairProvider,
              ),
  
              validator,
  
              2,
            );
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "recovery-test",
  
              plan:
                createPlan(),
  
              implementationWorkflow,
  
              diagnosisWorkflow,
  
              repairWorkflow,
  
              acceptanceCollector:
                new PassingAcceptanceCollector(),
  
              maxRecoveryCycles:
                2,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace,
            });
  
          expect(
            builder.worktreePaths,
          ).toEqual([
            workspacePath,
          ]);
  
          expect(
            validator.calls,
          ).toBe(2);
  
          expect(
            validator.worktreePaths,
          ).toEqual([
            workspacePath,
            workspacePath,
          ]);
  
          expect(
            diagnosisProvider.requests,
          ).toHaveLength(1);
  
          expect(
            repairProvider.requests,
          ).toHaveLength(1);
  
          expect(
            result.criterionResults.every(
              (criterion) =>
                criterion.passed,
            ),
          ).toBe(true);
  
          expect(
            result.humanInterventions,
          ).toBe(1);
        },
      );
    },
  );