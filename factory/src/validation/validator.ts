import type {
    ValidationCheck,
    ValidationResult,
  } from "../schemas/validation.js";
  import type {
    CommandRunner,
  } from "./command-runner.js";
  
  export interface ValidationCommand {
    name: string;
    command: string;
    args: string[];
  }
  
  export interface Validator {
    validate(
      worktreePath: string,
    ): Promise<ValidationResult>;
  }
  
  export class DeterministicValidator
    implements Validator
  {
    constructor(
      private readonly runner: CommandRunner,
      private readonly commands: ValidationCommand[],
    ) {}
  
    async validate(
      worktreePath: string,
    ): Promise<ValidationResult> {
      const startedAt = Date.now();
  
      const checks: ValidationCheck[] = [];
  
      for (const validationCommand of this.commands) {
        const result = await this.runner.run(
          validationCommand.command,
          validationCommand.args,
          worktreePath,
        );
  
        checks.push({
          name: validationCommand.name,
          command: result.command,
          args: result.args,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          durationMs: result.durationMs,
          passed: result.exitCode === 0,
        });
      }
  
      const failedChecks = checks
        .filter((check) => !check.passed)
        .map((check) => check.name);
  
      return {
        passed: failedChecks.length === 0,
        checks,
        failedChecks,
        durationMs: Date.now() - startedAt,
      };
    }
  }
  