import type {
    ModelCapability,
    ModelProfile,
  } from "./model-profile.js";
  import {
    ModelRegistry,
  } from "./model-registry.js";
  
  export interface ModelSelectionRequest {
    capability: ModelCapability;
    preferredProfileIds?: string[];
  }
  
  export interface ModelSelection {
    profile: ModelProfile;
    reasoning: string;
  }
  
  export class ModelSelectionPolicy {
    constructor(
      private readonly registry: ModelRegistry,
    ) {}
  
    select(
      request: ModelSelectionRequest,
    ): ModelSelection {
      const eligible =
        this.registry.findByCapability(
          request.capability,
        );
  
      if (eligible.length === 0) {
        throw new Error(
          `No registered model supports capability: ${request.capability}`,
        );
      }
  
      const preferredProfileIds =
        request.preferredProfileIds ?? [];
  
      for (
        const profileId
        of preferredProfileIds
      ) {
        const preferred =
          eligible.find(
            (profile) =>
              profile.id === profileId,
          );
  
        if (preferred) {
          return {
            profile: preferred,
            reasoning:
              `Selected preferred model ${preferred.id} for ${request.capability}.`,
          };
        }
      }
  
      const fallback = eligible[0];
  
      if (!fallback) {
        throw new Error(
          `No registered model supports capability: ${request.capability}`,
        );
      }
  
      return {
        profile: fallback,
        reasoning:
          `Selected first eligible model ${fallback.id} for ${request.capability}.`,
      };
    }
  }