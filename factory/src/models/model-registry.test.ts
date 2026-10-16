import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ModelProfile,
  } from "./model-profile.js";
  import {
    ModelRegistry,
  } from "./model-registry.js";
  
  function createProfiles():
    ModelProfile[] {
    return [
      {
        id: "primary-builder",
        provider: "openai",
        model: "builder-test-model",
        capabilities: [
          "analysis",
          "planning",
          "implementation",
          "repair",
        ],
      },
      {
        id: "independent-reviewer",
        provider: "anthropic",
        model: "review-test-model",
        capabilities: [
          "analysis",
          "review",
        ],
      },
      {
        id: "backup-reviewer",
        provider: "google",
        model: "backup-review-test-model",
        capabilities: [
          "review",
        ],
      },
    ];
  }
  
  describe("ModelRegistry", () => {
    it("registers and retrieves a model profile", () => {
      const profile =
        createProfiles()[0];
  
      if (!profile) {
        throw new Error(
          "Expected test profile.",
        );
      }
  
      const registry =
        new ModelRegistry();
  
      registry.register(profile);
  
      expect(
        registry.get(
          "primary-builder",
        ),
      ).toEqual(profile);
    });
  
    it("accepts initial model profiles", () => {
      const profiles =
        createProfiles();
  
      const registry =
        new ModelRegistry(profiles);
  
      expect(registry.list()).toEqual(
        profiles,
      );
    });
  
    it("rejects duplicate profile IDs", () => {
      const profile =
        createProfiles()[0];
  
      if (!profile) {
        throw new Error(
          "Expected test profile.",
        );
      }
  
      const registry =
        new ModelRegistry([profile]);
  
      expect(() =>
        registry.register(profile),
      ).toThrow(
        "Model profile already registered: primary-builder",
      );
    });
  
    it("rejects unknown profile IDs", () => {
      const registry =
        new ModelRegistry();
  
      expect(() =>
        registry.get("missing-model"),
      ).toThrow(
        "Unknown model profile: missing-model",
      );
    });
  
    it("finds models by capability", () => {
      const registry =
        new ModelRegistry(
          createProfiles(),
        );
  
      const reviewers =
        registry.findByCapability(
          "review",
        );
  
      expect(
        reviewers.map(
          (profile) => profile.id,
        ),
      ).toEqual([
        "independent-reviewer",
        "backup-reviewer",
      ]);
    });
  
    it("returns an empty list when no model supports a capability", () => {
      const registry =
        new ModelRegistry([
          {
            id: "review-only",
            provider: "demo",
            model: "review-only-model",
            capabilities: [
              "review",
            ],
          },
        ]);
  
      expect(
        registry.findByCapability(
          "implementation",
        ),
      ).toEqual([]);
    });
  
    it("returns a copy of the registry list", () => {
      const registry =
        new ModelRegistry(
          createProfiles(),
        );
  
      const first =
        registry.list();
  
      first.pop();
  
      expect(
        registry.list(),
      ).toHaveLength(3);
    });
  });