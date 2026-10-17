export type FactoryRuntimeMode =
  | "dry-run"
  | "live";

export interface FactoryRuntimeConfig {
  mode: FactoryRuntimeMode;
  repository: string;
  repositoryRoot: string;
  baseBranch: string;
  githubToken?: string;
}

export function createFactoryRuntimeConfig(
  input: {
    mode?: FactoryRuntimeMode;
    repository: string;
    repositoryRoot: string;
    baseBranch?: string;
    githubToken?: string;
  },
): FactoryRuntimeConfig {
  const mode =
    input.mode ??
    "dry-run";

  const repository =
    input.repository.trim();

  const repositoryRoot =
    input.repositoryRoot.trim();

  const baseBranch =
    (
      input.baseBranch ??
      "main"
    ).trim();

  if (
    repository.length === 0
  ) {
    throw new Error(
      "Factory repository is required.",
    );
  }

  if (
    repositoryRoot.length === 0
  ) {
    throw new Error(
      "Factory repository root is required.",
    );
  }

  if (
    baseBranch.length === 0
  ) {
    throw new Error(
      "Factory base branch is required.",
    );
  }

  if (
    mode === "live" &&
    !input.githubToken
  ) {
    throw new Error(
      "Live factory mode requires a GitHub token.",
    );
  }

  const config: FactoryRuntimeConfig = {
    mode,
    repository,
    repositoryRoot,
    baseBranch,
  };

  if (
    input.githubToken !== undefined
  ) {
    config.githubToken =
      input.githubToken;
  }

  return config;
}