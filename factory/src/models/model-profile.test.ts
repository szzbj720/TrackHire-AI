import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    ModelProfile,
  } from "./model-profile.js";
  import {
    supportsCapability,
  } from "./model-profile.js";
  
  describe("ModelProfile", () => {
    it("describes a provider model and its capabilities", () => {
      const profile: ModelProfile = {
        id: "primary-coding-model",
        provider: "openai",
        model: "test-model",
        capabilities: [
          "analysis",
          "planning",
          "implementation",
          "review",
        ],
      };
  
      expect(profile.id).toBe(
        "primary-coding-model",
      );
  
      expect(profile.provider).toBe(
        "openai",
      );
  
      expect(profile.model).toBe(
        "test-model",
      );
  
      expect(profile.capabilities).toEqual([
        "analysis",
        "planning",
        "implementation",
        "review",
      ]);
    });
  
    it("reports supported capabilities", () => {
      const profile: ModelProfile = {
        id: "review-model",
        provider: "anthropic",
        model: "test-review-model",
        capabilities: [
          "analysis",
          "review",
        ],
      };
  
      expect(
        supportsCapability(
          profile,
          "review",
        ),
      ).toBe(true);
  
      expect(
        supportsCapability(
          profile,
          "implementation",
        ),
      ).toBe(false);
    });
  
    it("supports deterministic demo models", () => {
      const profile: ModelProfile = {
        id: "demo-planner",
        provider: "demo",
        model: "demo-planner",
        capabilities: [
          "analysis",
          "planning",
        ],
      };
  
      expect(
        supportsCapability(
          profile,
          "planning",
        ),
      ).toBe(true);
    });
  
    it("can represent models from different providers with the same capability", () => {
      const profiles: ModelProfile[] = [
        {
          id: "openai-reviewer",
          provider: "openai",
          model: "openai-test-model",
          capabilities: ["review"],
        },
        {
          id: "anthropic-reviewer",
          provider: "anthropic",
          model: "anthropic-test-model",
          capabilities: ["review"],
        },
        {
          id: "google-reviewer",
          provider: "google",
          model: "google-test-model",
          capabilities: ["review"],
        },
      ];
  
      expect(
        profiles.every((profile) =>
          supportsCapability(
            profile,
            "review",
          ),
        ),
      ).toBe(true);
    });
  });