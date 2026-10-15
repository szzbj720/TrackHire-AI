import {
    execFile,
  } from "node:child_process";
  import {
    promisify,
  } from "node:util";
  
  const execFileAsync =
    promisify(execFile);
  
  export async function resolveGitRevision(
    repositoryPath: string,
    revision: string,
  ): Promise<string> {
    const { stdout } =
      await execFileAsync(
        "git",
        [
          "rev-parse",
          "--verify",
          `${revision}^{commit}`,
        ],
        {
          cwd: repositoryPath,
          encoding: "utf8",
        },
      );
  
    const commit = stdout.trim();
  
    if (!commit) {
      throw new Error(
        `Could not resolve Git revision ${revision}.`,
      );
    }
  
    return commit;
  }