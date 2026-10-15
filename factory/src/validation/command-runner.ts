import { spawn } from "node:child_process";

export interface CommandResult {
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface CommandRunner {
  run(
    command: string,
    args: string[],
    cwd: string,
  ): Promise<CommandResult>;
}

export class ProcessCommandRunner
  implements CommandRunner
{
  async run(
    command: string,
    args: string[],
    cwd: string,
  ): Promise<CommandResult> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        shell: false,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        resolve({
          command,
          args,
          exitCode: code ?? -1,
          stdout,
          stderr,
          durationMs:
            Date.now() - startedAt,
        });
      });
    });
  }
}