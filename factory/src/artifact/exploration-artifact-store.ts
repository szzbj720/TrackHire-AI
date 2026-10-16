import type {
    ExplorationEvidence,
  } from "../evidence/exploration-evidence.js";
  import {
    RunArtifactStore,
  } from "./run-artifact-store.js";
  
  export class ExplorationArtifactStore {
    constructor(
      private readonly store:
        RunArtifactStore,
    ) {}
  
    async writeEvidence(
      runId: string,
      evidence: ExplorationEvidence,
    ): Promise<void> {
      await this.store.writeJson(
        runId,
        "exploration",
        evidence,
      );
    }
  
    async readEvidence(
      runId: string,
    ): Promise<ExplorationEvidence> {
      return this.store.readJson<
        ExplorationEvidence
      >(
        runId,
        "exploration",
      );
    }
  }