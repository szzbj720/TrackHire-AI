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
  import {
    ModelSelectionPolicy,
  } from "./model-selection-policy.js";
  
  function createRegistry():
    ModelRegistry {
    const profiles: ModelProfile[] = [
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
        id: "primary-reviewer",
        provider: "anthropic",
        model: "review-test-model",
        capabilities: [
          "analysis",
          "review",
        ],
      },
      {
        id: "secondary-reviewer",
        provider: "google",
        model: "secondary-review-test-model",
        capabilities: [
          "review",
        ],
      },
    ];
  
    return new ModelRegistry(profiles);
  }
  
  describe("ModelSelectionPolicy", () => {
    it("selects the first eligible model by default", () => {
      const policy =
        new ModelSelectionPolicy(
          createRegistry(),
        );
  
      const selection =
        policy.select({
          capability:
            "implementation",
        });
  
      expect(
        selection.profile.id,
      ).toBe("primary-builder");
  
      expect(
        selection.reasoning,
      ).toContain(
        "first eligible model",
      );
    });
  
    it("selects an eligible preferred model", () => {
      const policy =
        new ModelSelectionPolicy(
          createRegistry(),
        );
  
      const selection =
        policy.select({
          capability: "review",
          preferredProfileIds: [
            "secondary-reviewer",
            "primary-reviewer",
          ],
        });
  
      expect(
        selection.profile.id,
      ).toBe(
        "secondary-reviewer",
      );
  
      expect(
        selection.reasoning,
      ).toContain(
        "Selected preferred model",
      );
    });
  
    it("ignores a preferred model that lacks the required capability", () => {
      const policy =
        new ModelSelectionPolicy(
          createRegistry(),
        );
  
      const selection =
        policy.select({
          capability: "review",
          preferredProfileIds: [
            "primary-builder",
            "primary-reviewer",
          ],
        });
  
      expect(
        selection.profile.id,
      ).toBe(
        "primary-reviewer",
      );
    });
  
    it("falls back when preferred profile IDs are unknown", () => {
      const policy =
        new ModelSelectionPolicy(
          createRegistry(),
        );
  
      const selection =
        policy.select({
          capability: "review",
          preferredProfileIds: [
            "missing-model",
          ],
        });
  
      expect(
        selection.profile.id,
      ).toBe(
        "primary-reviewer",
      );
    });
  
    it("throws when no registered model supports the capability", () => {
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
  
      const policy =
        new ModelSelectionPolicy(
          registry,
        );
  
      expect(() =>
        policy.select({
          capability:
            "implementation",
        }),
      ).toThrow(
        "No registered model supports capability: implementation",
      );
    });
  
    it("does not select an ineligible preferred model over an eligible fallback", () => {
      const policy =
        new ModelSelectionPolicy(
          createRegistry(),
        );
  
      const selection =
        policy.select({
          capability: "planning",
          preferredProfileIds: [
            "primary-reviewer",
          ],
        });
  
      expect(
        selection.profile.id,
      ).toBe("primary-builder");
    });
  });