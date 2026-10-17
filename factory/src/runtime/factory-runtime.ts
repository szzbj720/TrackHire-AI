import {
    DraftPullRequestLifecycle,
  } from "../github/draft-pull-request-lifecycle.js";
  
  import {
    DraftPullRequestService,
  } from "../github/draft-pull-request-service.js";
  
  import {
    DraftPullRequestWorkflow,
  } from "../github/draft-pull-request-workflow.js";
  
  import {
    PullRequestBodyBuilder,
  } from "../github/pull-request-body-builder.js";
  
  import type {
    GitHubFetch,
  } from "../github/github-api-client.js";
  
  import type {
    FactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  import {
    createRuntimeGitHubClient,
  } from "./runtime-github-client.js";
  
  export interface FactoryRuntime {
    config: FactoryRuntimeConfig;
    draftPullRequestLifecycle:
      DraftPullRequestLifecycle;
    isLiveGitHub: boolean;
  }
  
  export function createFactoryRuntime(
    config: FactoryRuntimeConfig,
    liveFetch?: GitHubFetch,
  ): FactoryRuntime {
    const github =
      createRuntimeGitHubClient(
        config,
        liveFetch,
      );
  
    const service =
      new DraftPullRequestService(
        github.client,
      );
  
    const workflow =
      new DraftPullRequestWorkflow(
        new PullRequestBodyBuilder(),
        service,
      );
  
    const lifecycle =
      new DraftPullRequestLifecycle(
        workflow,
      );
  
    return {
      config,
      draftPullRequestLifecycle:
        lifecycle,
      isLiveGitHub:
        github.isLive,
    };
  }