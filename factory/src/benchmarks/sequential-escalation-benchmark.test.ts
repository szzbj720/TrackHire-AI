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
    async implement(
      _input: BuilderInput,
    ): Promise<ImplementationResult> {
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
              "Added an incomplete interview date implementation.",
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
  
  class AlwaysFailingValidator
    implements Validator {
    calls = 0;
  
    async validate(
      _worktreePath: string,
    ): Promise<ValidationResult> {
      this.calls += 1;
  
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
              "The failure cannot be repaired safely without clarification.",
  
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
  }
  
  class RecordingAcceptanceCollector
    implements BenchmarkAcceptanceCollector {
    observedStatus:
      string | undefined;
  
    async collect(input: Parameters<
      BenchmarkAcceptanceCollector["collect"]
    >[0]) {
      this.observedStatus =
        input.task.status;
  
      return input.scenario
        .acceptanceCriteria
        .map(
          (criterion) => ({
            criterionId:
              criterion.id,
  
            passed: false,
  
            evidence: [
              `Task stopped with status ${input.task.status}.`,
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
        "The requested behavior may be ambiguous.",
      ],
  
      assumptions: [],
  
      requiresHumanInput:
        false,
    };
  }
  
  describe(
    "Sequential escalation benchmark",
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
        "escalates uncertain failures instead of attempting repair",
        async () => {
          const workspacePath =
            await mkdtemp(
              join(
                tmpdir(),
                "benchmark-escalation-",
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
  
          await writeFile(
            join(
              modelDirectory,
              "job_application.dart",
            ),
            [
              "class JobApplication {",
              "  final DateTime? interviewDate;",
              "}",
              "",
            ].join("\n"),
            "utf8",
          );
  
          const validator =
            new AlwaysFailingValidator();
  
          const diagnosisProvider =
            new DeterministicDiagnosisProvider({
              diagnosis: {
                category:
                  "REQUIREMENT_AMBIGUITY",
  
                summary:
                  "The intended interview date behavior is ambiguous.",
  
                evidence: [
                  "The failure cannot be resolved safely from the available requirements.",
                ],
  
                suspectedFiles: [
                  "lib/models/job_application.dart",
                ],
  
                recommendedAction:
                  "Ask a human to clarify the expected behavior before modifying the implementation.",
  
                repairable:
                  false,
  
                confidence:
                  0.4,
  
                requiresHumanInput:
                  true,
              },
            });
  
          const repairProvider =
            new DeterministicCodeChangeProvider({
              changeSet: {
                summary:
                  "This repair must never execute.",
  
                writes: [
                  {
                    path:
                      "lib/models/job_application.dart",
  
                    content:
                      "THIS SHOULD NEVER BE WRITTEN",
  
                    summary:
                      "Unsafe repair.",
                  },
                ],
  
                assumptions: [],
  
                warnings: [],
  
                requiresHumanInput:
                  false,
              },
            });
  
          const acceptanceCollector =
            new RecordingAcceptanceCollector();
  
          const executor =
            new SequentialBenchmarkExecutor({
              runId:
                "escalation-test",
  
              plan:
                createPlan(),
  
              implementationWorkflow:
                new ImplementationWorkflow(
                  new FailingBuilder(),
                  validator,
                ),
  
              diagnosisWorkflow:
                new DiagnosisWorkflow(
                  new ModelDiagnostician(
                    diagnosisProvider,
                  ),
                ),
  
              repairWorkflow:
                new RepairWorkflow(
                  new ModelRepairer(
                    repairProvider,
                  ),
  
                  validator,
  
                  2,
                ),
  
              acceptanceCollector,
  
              maxRecoveryCycles:
                2,
            });
  
          const result =
            await executor.execute({
              scenario:
                trackHireInterviewDateBenchmark,
  
              workspace: {
                scenarioId:
                  "trackhire-interview-date",
  
                runId:
                  "escalation-test",
  
                strategyId:
                  "sequential",
  
                baselineRevision:
                  "abc123",
  
                path:
                  workspacePath,
  
                branch:
                  "factory/benchmark-escalation",
              },
            });
  
          expect(
            validator.calls,
          ).toBe(1);
  
          expect(
            diagnosisProvider.requests,
          ).toHaveLength(1);
  
          expect(
            repairProvider.requests,
          ).toHaveLength(0);
  
          expect(
            acceptanceCollector
              .observedStatus,
          ).toBe(
            "NEEDS_HUMAN",
          );
  
          expect(
            result.criterionResults.every(
              (criterion) =>
                !criterion.passed,
            ),
          ).toBe(true);
  
          const finalFile =
            await import(
              "node:fs/promises"
            ).then(
              ({ readFile }) =>
                readFile(
                  join(
                    workspacePath,
                    "lib",
                    "models",
                    "job_application.dart",
                  ),
                  "utf8",
                ),
            );
  
          expect(
            finalFile,
          ).not.toContain(
            "THIS SHOULD NEVER BE WRITTEN",
          );
        },
      );
    },
  );