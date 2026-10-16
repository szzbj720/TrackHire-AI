import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  import type {
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    Validator,
  } from "../validation/validator.js";
  import type {
    ExplorationImplementationResult,
  } from "./exploration-implementation-runner.js";
  import type {
    ExplorationWorkspace,
  } from "./exploration-workspace-manager.js";
  import {
    ExplorationImplementationValidator,
  } from "./exploration-implementation-validator.js";
  
  class RecordingValidator
    implements Validator
  {
    worktreePaths: string[] = [];
  
    constructor(
      private readonly result:
        ValidationResult,
    ) {}
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      this.worktreePaths.push(
        worktreePath,
      );
  
      return this.result;
    }
  }
  
  class FailingValidator
    implements Validator
  {
    async validate(
      _worktreePath: string,
    ): Promise<ValidationResult> {
      throw new Error(
        "Validation infrastructure failed",
      );
    }
  }
  
  function createImplementationResult(
    candidateId: string,
    overrides:
      Partial<ImplementationResult> = {},
  ): ExplorationImplementationResult {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      status: "success",
      implementation: {
        summary:
          `Implemented ${candidateId}.`,
        changedFiles: [
          {
            path:
              "lib/models/job_application.dart",
            changeType: "modified",
            summary:
              "Added optional interview date.",
          },
        ],
        commandsRun: [],
        assumptions: [],
        warnings: [],
        requiresHumanInput: false,
        ...overrides,
      },
    };
  }
  
  function createFailedImplementation(
    candidateId: string,
  ): ExplorationImplementationResult {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      status: "error",
      error:
        "Implementation failed",
    };
  }
  
  function createWorkspace(
    candidateId: string,
  ): ExplorationWorkspace {
    return {
      candidateId,
      targetId:
        `explorer-${candidateId}`,
      model:
        `model-${candidateId}`,
      worktree: {
        path:
          `/tmp/${candidateId}`,
        branch:
          `factory/${candidateId}`,
      },
    };
  }
  
  function passingValidation():
    ValidationResult {
    return {
      passed: true,
      checks: [
        {
          name: "flutter test",
          command: "flutter",
          args: ["test"],
          exitCode: 0,
          stdout:
            "All tests passed.",
          stderr: "",
          durationMs: 100,
          passed: true,
        },
      ],
      failedChecks: [],
      durationMs: 100,
    };
  }
  
  function failingValidation():
    ValidationResult {
    return {
      passed: false,
      checks: [
        {
          name: "flutter test",
          command: "flutter",
          args: ["test"],
          exitCode: 1,
          stdout: "",
          stderr:
            "Test failed.",
          durationMs: 100,
          passed: false,
        },
      ],
      failedChecks: [
        "flutter test",
      ],
      durationMs: 100,
    };
  }
  
  describe(
    "ExplorationImplementationValidator",
    () => {
      it("validates an implementation inside its isolated workspace", async () => {
        const validator =
          new RecordingValidator(
            passingValidation(),
          );
  
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator,
            },
          ]);
  
        expect(
          validator.worktreePaths,
        ).toEqual([
          "/tmp/candidate-a",
        ]);
  
        expect(
          result.results[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          status: "success",
          validation: {
            passed: true,
          },
        });
      });
  
      it("preserves deterministic validation failure evidence", async () => {
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator:
                new RecordingValidator(
                  failingValidation(),
                ),
            },
          ]);
  
        expect(
          result.results[0],
        ).toMatchObject({
          status: "success",
          validation: {
            passed: false,
            failedChecks: [
              "flutter test",
            ],
          },
        });
      });
  
      it("validates competing implementations independently", async () => {
        const validatorA =
          new RecordingValidator(
            passingValidation(),
          );
  
        const validatorB =
          new RecordingValidator(
            failingValidation(),
          );
  
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator: validatorA,
            },
            {
              implementation:
                createImplementationResult(
                  "candidate-b",
                ),
              workspace:
                createWorkspace(
                  "candidate-b",
                ),
              validator: validatorB,
            },
          ]);
  
        expect(
          result.results,
        ).toHaveLength(2);
  
        expect(
          validatorA.worktreePaths,
        ).toEqual([
          "/tmp/candidate-a",
        ]);
  
        expect(
          validatorB.worktreePaths,
        ).toEqual([
          "/tmp/candidate-b",
        ]);
  
        expect(
          result.results[0],
        ).toMatchObject({
          validation: {
            passed: true,
          },
        });
  
        expect(
          result.results[1],
        ).toMatchObject({
          validation: {
            passed: false,
          },
        });
      });
  
      it("skips deterministic validation when implementation failed", async () => {
        const validator =
          new RecordingValidator(
            passingValidation(),
          );
  
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createFailedImplementation(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator,
            },
          ]);
  
        expect(
          result.results[0],
        ).toEqual({
          candidateId:
            "candidate-a",
          targetId:
            "explorer-candidate-a",
          model:
            "model-candidate-a",
          status: "skipped",
          reason:
            "Implementation failed before deterministic validation.",
        });
  
        expect(
          validator.worktreePaths,
        ).toHaveLength(0);
      });
  
      it("skips deterministic validation when implementation requires human input", async () => {
        const validator =
          new RecordingValidator(
            passingValidation(),
          );
  
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                  {
                    changedFiles: [],
                    requiresHumanInput:
                      true,
                  },
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator,
            },
          ]);
  
        expect(
          result.results[0],
        ).toMatchObject({
          candidateId:
            "candidate-a",
          status: "skipped",
          reason:
            "Implementation requires human input before deterministic validation.",
        });
  
        expect(
          validator.worktreePaths,
        ).toHaveLength(0);
      });
  
      it("records validation infrastructure failures without losing other candidates", async () => {
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator:
                new FailingValidator(),
            },
            {
              implementation:
                createImplementationResult(
                  "candidate-b",
                ),
              workspace:
                createWorkspace(
                  "candidate-b",
                ),
              validator:
                new RecordingValidator(
                  passingValidation(),
                ),
            },
          ]);
  
        expect(
          result.results[0],
        ).toEqual({
          candidateId:
            "candidate-a",
          targetId:
            "explorer-candidate-a",
          model:
            "model-candidate-a",
          status: "error",
          error:
            "Validation infrastructure failed",
        });
  
        expect(
          result.results[1],
        ).toMatchObject({
          candidateId:
            "candidate-b",
          status: "success",
          validation: {
            passed: true,
          },
        });
      });
  
      it("rejects a mismatched validation workspace", async () => {
        const runner =
          new ExplorationImplementationValidator();
  
        const result =
          await runner.validate([
            {
              implementation:
                createImplementationResult(
                  "candidate-a",
                ),
              workspace:
                createWorkspace(
                  "candidate-b",
                ),
              validator:
                new RecordingValidator(
                  passingValidation(),
                ),
            },
          ]);
  
        expect(
          result.results[0],
        ).toEqual({
          candidateId:
            "candidate-a",
          targetId:
            "explorer-candidate-a",
          model:
            "model-candidate-a",
          status: "error",
          error:
            "Exploration validation workspace candidate mismatch: expected candidate-a, received candidate-b",
        });
      });
  
      it("rejects duplicate validation candidates before execution", async () => {
        const implementation =
          createImplementationResult(
            "candidate-a",
          );
  
        const validator =
          new RecordingValidator(
            passingValidation(),
          );
  
        const runner =
          new ExplorationImplementationValidator();
  
        await expect(
          runner.validate([
            {
              implementation,
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator,
            },
            {
              implementation,
              workspace:
                createWorkspace(
                  "candidate-a",
                ),
              validator,
            },
          ]),
        ).rejects.toThrow(
          "Duplicate exploration validation candidate: candidate-a",
        );
  
        expect(
          validator.worktreePaths,
        ).toHaveLength(0);
      });
    },
  );