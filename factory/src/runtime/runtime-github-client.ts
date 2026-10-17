import {
    FakeGitHubClient,
  } from "../github/fake-github-client.js";
  
  import {
    GitHubApiClient,
    type GitHubFetch,
  } from "../github/github-api-client.js";
  
  import type {
    GitHubClient,
  } from "../github/github-client.js";
  
  import type {
    FactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  export interface RuntimeGitHubClientResult {
    client: GitHubClient;
    mode: FactoryRuntimeConfig["mode"];
    isLive: boolean;
  }
  
  export function createRuntimeGitHubClient(
    config: FactoryRuntimeConfig,
    liveFetch?: GitHubFetch,
  ): RuntimeGitHubClientResult {
    if (
      config.mode ===
      "dry-run"
    ) {
      return {
        client:
          new FakeGitHubClient(),
  
        mode:
          "dry-run",
  
        isLive:
          false,
      };
    }
  
    const token =
      config.githubToken;
  
    if (!token) {
      throw new Error(
        "Live factory mode requires a GitHub token.",
      );
    }
  
    const client =
      liveFetch === undefined
        ? new GitHubApiClient(
            token,
          )
        : new GitHubApiClient(
            token,
            liveFetch,
          );
  
    return {
      client,
  
      mode:
        "live",
  
      isLive:
        true,
    };
  }