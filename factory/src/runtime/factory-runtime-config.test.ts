import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    createFactoryRuntimeConfig,
  } from "./factory-runtime-config.js";
  
  describe(
    "createFactoryRuntimeConfig",
    () => {
      it(
        "defaults to safe dry-run mode",
        () => {
          const config =
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            });
  
          expect(
            config.mode,
          ).toBe(
            "dry-run",
          );
  
          expect(
            config.baseBranch,
          ).toBe(
            "main",
          );
        },
      );
  
      it(
        "accepts explicit live mode with a GitHub token",
        () => {
          const config =
            createFactoryRuntimeConfig({
              mode:
                "live",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
  
              baseBranch:
                "main",
  
              githubToken:
                "test-token",
            });
  
          expect(
            config.mode,
          ).toBe(
            "live",
          );
  
          expect(
            config.githubToken,
          ).toBe(
            "test-token",
          );
        },
      );
  
      it(
        "rejects live mode without a GitHub token",
        () => {
          expect(() =>
            createFactoryRuntimeConfig({
              mode:
                "live",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
            }),
          ).toThrow(
            "Live factory mode requires a GitHub token.",
          );
        },
      );
  
      it(
        "rejects an empty repository",
        () => {
          expect(() =>
            createFactoryRuntimeConfig({
              repository:
                "   ",
  
              repositoryRoot:
                "/tmp/trackhire",
            }),
          ).toThrow(
            "Factory repository is required.",
          );
        },
      );
  
      it(
        "rejects an empty repository root",
        () => {
          expect(() =>
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "   ",
            }),
          ).toThrow(
            "Factory repository root is required.",
          );
        },
      );
  
      it(
        "rejects an empty base branch",
        () => {
          expect(() =>
            createFactoryRuntimeConfig({
              repository:
                "szzbj720/TrackHire-AI",
  
              repositoryRoot:
                "/tmp/trackhire",
  
              baseBranch:
                "   ",
            }),
          ).toThrow(
            "Factory base branch is required.",
          );
        },
      );
  
      it(
        "trims repository configuration values",
        () => {
          const config =
            createFactoryRuntimeConfig({
              repository:
                "  szzbj720/TrackHire-AI  ",
  
              repositoryRoot:
                "  /tmp/trackhire  ",
  
              baseBranch:
                "  main  ",
            });
  
          expect(
            config.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
  
          expect(
            config.repositoryRoot,
          ).toBe(
            "/tmp/trackhire",
          );
  
          expect(
            config.baseBranch,
          ).toBe(
            "main",
          );
        },
      );
    },
  );