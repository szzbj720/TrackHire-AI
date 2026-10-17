import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import type {
    FactoryRuntime,
  } from "./factory-runtime.js";
  
  import {
    buildFactoryRunReport,
    type FactoryRunReport,
  } from "./factory-run-report.js";
  
  import {
    buildPullRequestEvidence,
  } from "./pull-request-evidence-adapter.js";
  
  export interface FinalizeFactoryRunInput {
    runtime: FactoryRuntime;
    result: AdaptiveFactoryResult;
    headBranch: string;
    pullRequestTitle: string;
  }
  
  export async function finalizeFactoryRun(
    input: FinalizeFactoryRunInput,
  ): Promise<FactoryRunReport> {
    const {
      runtime,
      result,
    } = input;
  
    if (
      result.stopReason !==
      "FINAL_APPROVAL_REQUIRED"
    ) {
      return buildFactoryRunReport(
        result,
      );
    }
  
    const headBranch =
      input.headBranch.trim();
  
    if (
      headBranch.length === 0
    ) {
      throw new Error(
        "Draft pull request head branch is required.",
      );
    }
  
    const pullRequestTitle =
      input.pullRequestTitle.trim();
  
    if (
      pullRequestTitle.length === 0
    ) {
      throw new Error(
        "Draft pull request title is required.",
      );
    }
  
    const evidence =
      buildPullRequestEvidence(
        result,
      );
  
    const pullRequest =
      await runtime
        .draftPullRequestLifecycle
        .create({
          result,
  
          repository:
            runtime.config.repository,
  
          baseBranch:
            runtime.config.baseBranch,
  
          headBranch,
  
          title:
            pullRequestTitle,
  
          evidence,
        });
  
    return buildFactoryRunReport(
      result,
      pullRequest,
    );
  }