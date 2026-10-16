import type {
    ModelCapability,
    ModelProfile,
  } from "./model-profile.js";
  
  export class ModelRegistry {
    private readonly profiles =
      new Map<string, ModelProfile>();
  
    constructor(
      profiles: ModelProfile[] = [],
    ) {
      for (const profile of profiles) {
        this.register(profile);
      }
    }
  
    register(profile: ModelProfile): void {
      if (this.profiles.has(profile.id)) {
        throw new Error(
          `Model profile already registered: ${profile.id}`,
        );
      }
  
      this.profiles.set(
        profile.id,
        profile,
      );
    }
  
    get(profileId: string): ModelProfile {
      const profile =
        this.profiles.get(profileId);
  
      if (!profile) {
        throw new Error(
          `Unknown model profile: ${profileId}`,
        );
      }
  
      return profile;
    }
  
    list(): ModelProfile[] {
      return Array.from(
        this.profiles.values(),
      );
    }
  
    findByCapability(
      capability: ModelCapability,
    ): ModelProfile[] {
      return this.list().filter(
        (profile) =>
          profile.capabilities.includes(
            capability,
          ),
      );
    }
  }