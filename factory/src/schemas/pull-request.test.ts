import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    createDraftPullRequestRequestSchema,
    pullRequestResultSchema,
  } from "./pull-request.js";
  
  describe(
    "pull request schemas",
    () => {
      it(
        "accepts a valid draft pull request request",
        () => {
          const result =
            createDraftPullRequestRequestSchema.parse({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "Adds interview date support.",
            });
  
          expect(
            result.repository,
          ).toBe(
            "szzbj720/TrackHire-AI",
          );
  
          expect(
            result.baseBranch,
          ).toBe(
            "main",
          );
  
          expect(
            result.headBranch,
          ).toBe(
            "factory/TH-001",
          );
        },
      );
  
      it(
        "rejects an empty repository",
        () => {
          expect(() =>
            createDraftPullRequestRequestSchema.parse({
              repository:
                "",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "",
            }),
          ).toThrow();
        },
      );
  
      it(
        "rejects an empty base branch",
        () => {
          expect(() =>
            createDraftPullRequestRequestSchema.parse({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              body:
                "",
            }),
          ).toThrow();
        },
      );
  
      it(
        "rejects an empty head branch",
        () => {
          expect(() =>
            createDraftPullRequestRequestSchema.parse({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "",
  
              title:
                "feat: add interview date",
  
              body:
                "",
            }),
          ).toThrow();
        },
      );
  
      it(
        "accepts a valid pull request result",
        () => {
          const result =
            pullRequestResultSchema.parse({
              number:
                7,
  
              url:
                "https://github.com/szzbj720/TrackHire-AI/pull/7",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              status:
                "draft",
  
              isDraft:
                true,
            });
  
          expect(
            result.number,
          ).toBe(7);
  
          expect(
            result.status,
          ).toBe(
            "draft",
          );
  
          expect(
            result.isDraft,
          ).toBe(true);
        },
      );
  
      it(
        "rejects invalid pull request statuses",
        () => {
          expect(() =>
            pullRequestResultSchema.parse({
              number:
                7,
  
              url:
                "https://github.com/szzbj720/TrackHire-AI/pull/7",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              status:
                "pending",
  
              isDraft:
                true,
            }),
          ).toThrow();
        },
      );
  
      it(
        "rejects non-positive pull request numbers",
        () => {
          expect(() =>
            pullRequestResultSchema.parse({
              number:
                0,
  
              url:
                "https://github.com/szzbj720/TrackHire-AI/pull/7",
  
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "feat: add interview date",
  
              status:
                "draft",
  
              isDraft:
                true,
            }),
          ).toThrow();
        },
      );
    },
  );