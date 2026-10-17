import {
    readFile,
  } from "node:fs/promises";
  
  import {
    resolve,
  } from "node:path";
  
  import type {
    AdaptiveFactoryResult,
  } from "../orchestrator/adaptive-factory.js";
  
  import {
    createFactoryRuntimeConfig,
    type FactoryRuntimeMode,
  } from "./factory-runtime-config.js";
  
  import {
    createFactoryRuntime,
  } from "./factory-runtime.js";
  
  import {
    finalizeFactoryRun,
  } from "./finalize-factory-run.js";
  
  export interface FactoryDeliveryCliInput {
    resultFile: string;
    headBranch: string;
    pullRequestTitle: string;
  }
  
  export interface FactoryDeliveryEnvironment {
    FACTORY_MODE?: string;
    FACTORY_REPOSITORY?: string;
    FACTORY_REPOSITORY_ROOT?: string;
    FACTORY_BASE_BRANCH?: string;
    GITHUB_TOKEN?: string;
  }
  
  export function parseFactoryDeliveryArguments(
    args: string[],
  ): FactoryDeliveryCliInput {
    const [
      resultFile,
      headBranch,
      ...titleParts
    ] = args;
  
    if (
      !resultFile ||
      resultFile.trim().length === 0
    ) {
      throw new Error(
        "Factory result file is required.",
      );
    }
  
    if (
      !headBranch ||
      headBranch.trim().length === 0
    ) {
      throw new Error(
        "Factory head branch is required.",
      );
    }
  
    const pullRequestTitle =
      titleParts.join(" ").trim();
  
    if (
      pullRequestTitle.length === 0
    ) {
      throw new Error(
        "Factory pull request title is required.",
      );
    }
  
    return {
      resultFile:
        resultFile.trim(),
  
      headBranch:
        headBranch.trim(),
  
      pullRequestTitle,
    };
  }
  
  export function parseFactoryRuntimeMode(
    value:
      string | undefined,
  ): FactoryRuntimeMode {
    if (
      value === undefined ||
      value.trim().length === 0
    ) {
      return "dry-run";
    }
  
    if (
      value === "dry-run" ||
      value === "live"
    ) {
      return value;
    }
  
    throw new Error(
      `Unsupported FACTORY_MODE: ${value}`,
    );
  }
  
  export async function runFactoryDeliveryCli(
    args: string[],
    environment:
      FactoryDeliveryEnvironment =
        process.env,
  ): Promise<void> {
    const input =
      parseFactoryDeliveryArguments(
        args,
      );
  
    const mode =
      parseFactoryRuntimeMode(
        environment.FACTORY_MODE,
      );
  
    const repository =
      environment.FACTORY_REPOSITORY ??
      "szzbj720/TrackHire-AI";
  
    const repositoryRoot =
      environment.FACTORY_REPOSITORY_ROOT ??
      resolve(
        process.cwd(),
        "..",
      );
  
    const baseBranch =
      environment.FACTORY_BASE_BRANCH ??
      "main";
  
    const config =
      createFactoryRuntimeConfig({
        mode,
  
        repository,
  
        repositoryRoot,
  
        baseBranch,
  
        ...(
          environment.GITHUB_TOKEN
            ? {
                githubToken:
                  environment.GITHUB_TOKEN,
              }
            : {}
        ),
      });
  
    const runtime =
      createFactoryRuntime(
        config,
      );
  
    const resultPath =
      resolve(
        process.cwd(),
        input.resultFile,
      );
  
    const rawResult =
      await readFile(
        resultPath,
        "utf8",
      );
  
    const result =
      JSON.parse(
        rawResult,
      ) as AdaptiveFactoryResult;
  
    const report =
      await finalizeFactoryRun({
        runtime,
  
        result,
  
        headBranch:
          input.headBranch,
  
        pullRequestTitle:
          input.pullRequestTitle,
      });
  
    console.log(
      JSON.stringify(
        report,
        null,
        2,
      ),
    );
  }