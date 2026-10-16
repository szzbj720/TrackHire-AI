export type ModelProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "demo";

export type ModelCapability =
  | "analysis"
  | "planning"
  | "implementation"
  | "diagnosis"
  | "repair"
  | "review";

export interface ModelProfile {
  id: string;
  provider: ModelProviderId;
  model: string;
  capabilities: ModelCapability[];
}

export function supportsCapability(
  profile: ModelProfile,
  capability: ModelCapability,
): boolean {
  return profile.capabilities.includes(
    capability,
  );
}