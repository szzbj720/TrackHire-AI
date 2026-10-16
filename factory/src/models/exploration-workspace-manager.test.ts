import {
    afterEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import type {
    ExplorationCandidate,
  } from "../schemas/exploration-candidate.js";
  import {
    createTaskWorktree,
  } from "../tools/git-worktree.js";
  import {
    ExplorationWorkspaceManager,
  } from "./exploration-workspace-manager.js";
  
  vi.mock(
    "../tools/git-worktree.js",
    () => ({
      createTaskWorktree:
        vi.fn(),
    }),
  );
  
  const mockedCreateTaskWorktree =
    vi.mocked(
      createTaskWorktree,
    );
  
  function createCandidate(
    overrides:
      Partial<ExplorationCandidate> = {},
  ): ExplorationCandidate {
    return {
      candidateId: "candidate-a",
      targetId: "explorer-a",
      model: "model-a",
  
      summary:
        "Add interview date support.",
  
      approach:
        "Extend the application model.",
  
      affectedFiles: [
        "lib/models/job_application.dart",
      ],
  
      implementationSteps: [
        "Add the optional interview date.",
      ],
  
      validationSteps: [
        "Run flutter test.",
      ],
  
      advantages: [
        "Small implementation scope.",
      ],
  
      risks: [
        "Persisted data must remain compatible.",
      ],
  
      assumptions: [
        "Missing dates deserialize as null.",
      ],
  
      requiresHumanInput: false,
      confidence: 0.9,
  
      ...overrides,
    };
  }
  
  describe(
    "ExplorationWorkspaceManager",
    () => {
      afterEach(() => {
        vi.clearAllMocks();
      });
  
      it("creates an isolated worktree for a candidate", async () => {
        mockedCreateTaskWorktree
          .mockResolvedValue({
            path:
              "/tmp/candidate-a",
            branch:
              "factory/th-001-exploration-candidate-a",
          });
  
        const manager =
          new ExplorationWorkspaceManager();
  
        const workspace =
          await manager.create(
            createCandidate(),
            {
              repositoryRoot:
                "/repo",
              taskId: "TH-001",
              baseBranch: "main",
            },
          );
  
        expect(
          mockedCreateTaskWorktree,
        ).toHaveBeenCalledWith({
          repositoryRoot: "/repo",
          taskId:
            "TH-001-exploration-candidate-a",
          baseBranch: "main",
        });
  
        expect(workspace).toEqual({
          candidateId:
            "candidate-a",
          targetId: "explorer-a",
          model: "model-a",
          worktree: {
            path:
              "/tmp/candidate-a",
            branch:
              "factory/th-001-exploration-candidate-a",
          },
        });
      });
  
      it("creates separate worktrees for competing candidates", async () => {
        mockedCreateTaskWorktree
          .mockImplementation(
            async (options) => ({
              path:
                `/tmp/${options.taskId}`,
              branch:
                `factory/${options.taskId.toLowerCase()}`,
            }),
          );
  
        const manager =
          new ExplorationWorkspaceManager();
  
        const workspaces =
          await manager.createAll(
            [
              createCandidate({
                candidateId:
                  "candidate-a",
              }),
              createCandidate({
                candidateId:
                  "candidate-b",
                targetId:
                  "explorer-b",
                model: "model-b",
              }),
            ],
            {
              repositoryRoot:
                "/repo",
              taskId: "TH-001",
              baseBranch: "main",
            },
          );
  
        expect(workspaces).toHaveLength(
          2,
        );
  
        expect(
          workspaces[0]?.worktree.branch,
        ).not.toBe(
          workspaces[1]?.worktree.branch,
        );
  
        expect(
          mockedCreateTaskWorktree,
        ).toHaveBeenNthCalledWith(
          1,
          {
            repositoryRoot: "/repo",
            taskId:
              "TH-001-exploration-candidate-a",
            baseBranch: "main",
          },
        );
  
        expect(
          mockedCreateTaskWorktree,
        ).toHaveBeenNthCalledWith(
          2,
          {
            repositoryRoot: "/repo",
            taskId:
              "TH-001-exploration-candidate-b",
            baseBranch: "main",
          },
        );
      });
  
      it("preserves candidate execution identity in each workspace", async () => {
        mockedCreateTaskWorktree
          .mockResolvedValue({
            path: "/tmp/worktree",
            branch:
              "factory/worktree",
          });
  
        const manager =
          new ExplorationWorkspaceManager();
  
        const workspace =
          await manager.create(
            createCandidate({
              candidateId:
                "candidate-b",
              targetId:
                "explorer-b",
              model:
                "independent-model-b",
            }),
            {
              repositoryRoot:
                "/repo",
              taskId: "TH-001",
              baseBranch: "main",
            },
          );
  
        expect(workspace).toMatchObject({
          candidateId:
            "candidate-b",
          targetId: "explorer-b",
          model:
            "independent-model-b",
        });
      });
  
      it("rejects duplicate candidate IDs before creating worktrees", async () => {
        const manager =
          new ExplorationWorkspaceManager();
  
        await expect(
          manager.createAll(
            [
              createCandidate(),
              createCandidate({
                targetId:
                  "explorer-b",
                model: "model-b",
              }),
            ],
            {
              repositoryRoot:
                "/repo",
              taskId: "TH-001",
              baseBranch: "main",
            },
          ),
        ).rejects.toThrow(
          "Duplicate exploration candidate ID: candidate-a",
        );
  
        expect(
          mockedCreateTaskWorktree,
        ).not.toHaveBeenCalled();
      });
  
      it("propagates worktree creation failures", async () => {
        mockedCreateTaskWorktree
          .mockRejectedValue(
            new Error(
              "Git worktree creation failed",
            ),
          );
  
        const manager =
          new ExplorationWorkspaceManager();
  
        await expect(
          manager.create(
            createCandidate(),
            {
              repositoryRoot:
                "/repo",
              taskId: "TH-001",
              baseBranch: "main",
            },
          ),
        ).rejects.toThrow(
          "Git worktree creation failed",
        );
      });
    },
  );