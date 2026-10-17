import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    FakeGitHubClient,
  } from "./fake-github-client.js";
  
  describe(
    "FakeGitHubClient",
    () => {
      it(
        "creates deterministic draft pull requests",
        async () => {
          const client =
            new FakeGitHubClient(
              10,
            );
  
          const result =
            await client.createDraftPullRequest({
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
            result.number,
          ).toBe(10);
  
          expect(
            result.url,
          ).toBe(
            "https://github.com/szzbj720/TrackHire-AI/pull/10",
          );
  
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
        "increments pull request numbers deterministically",
        async () => {
          const client =
            new FakeGitHubClient(
              3,
            );
  
          const first =
            await client.createDraftPullRequest({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-001",
  
              title:
                "first",
  
              body:
                "",
            });
  
          const second =
            await client.createDraftPullRequest({
              repository:
                "szzbj720/TrackHire-AI",
  
              baseBranch:
                "main",
  
              headBranch:
                "factory/TH-002",
  
              title:
                "second",
  
              body:
                "",
            });
  
          expect(
            first.number,
          ).toBe(3);
  
          expect(
            second.number,
          ).toBe(4);
        },
      );
  
      it(
        "records created pull requests",
        async () => {
          const client =
            new FakeGitHubClient();
  
          await client.createDraftPullRequest({
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
  
          const created =
            client.listCreatedPullRequests();
  
          expect(
            created,
          ).toHaveLength(1);
  
          expect(
            created[0]?.headBranch,
          ).toBe(
            "factory/TH-001",
          );
        },
      );
  
      it(
        "returns a copy of recorded pull requests",
        async () => {
          const client =
            new FakeGitHubClient();
  
          await client.createDraftPullRequest({
            repository:
              "szzbj720/TrackHire-AI",
  
            baseBranch:
              "main",
  
            headBranch:
              "factory/TH-001",
  
            title:
              "feat: add interview date",
  
            body:
              "",
          });
  
          const firstRead =
            client.listCreatedPullRequests();
  
          firstRead.length =
            0;
  
          const secondRead =
            client.listCreatedPullRequests();
  
          expect(
            secondRead,
          ).toHaveLength(1);
        },
      );
  
      it(
        "rejects invalid starting pull request numbers",
        () => {
          expect(() =>
            new FakeGitHubClient(
              0,
            ),
          ).toThrow();
  
          expect(() =>
            new FakeGitHubClient(
              1.5,
            ),
          ).toThrow();
        },
      );
    },
  );