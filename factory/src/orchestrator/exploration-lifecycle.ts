import type {
    ExplorationArtifactStore,
  } from "../artifact/exploration-artifact-store.js";
  import type {
    ExplorationWorkflowInput,
    ExplorationWorkflowResult,
  } from "./exploration-workflow.js";
  import {
    ExplorationWorkflow,
  } from "./exploration-workflow.js";
  
  export interface ExplorationLifecycleInput
    extends ExplorationWorkflowInput {
    runId: string;
  }
  
  export class ExplorationLifecycle {
    constructor(
      private readonly workflow:
        ExplorationWorkflow,
      private readonly artifactStore:
        ExplorationArtifactStore,
    ) {}
  
    async run(
      input: ExplorationLifecycleInput,
    ): Promise<ExplorationWorkflowResult> {
      const {
        runId,
        ...workflowInput
      } = input;
  
      const result =
        await this.workflow.run(
          workflowInput,
        );
  
      if (result.evidence) {
        await this.artifactStore.writeEvidence(
          runId,
          result.evidence,
        );
      }
  
      return result;
    }
  }