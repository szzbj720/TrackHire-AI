import {
    mkdtemp,
    readFile,
    symlink,
    writeFile,
  } from "node:fs/promises";
  import { tmpdir } from "node:os";
  import { join } from "node:path";
  
  import { describe, expect, it } from "vitest";
  
  import { Workspace } from "./workspace.js";
  
  async function createWorkspace(): Promise<{
    root: string;
    workspace: Workspace;
  }> {
    const root = await mkdtemp(
      join(tmpdir(), "factory-workspace-test-"),
    );
  
    return {
      root,
      workspace: new Workspace(root),
    };
  }
  
  describe("Workspace", () => {
    it("reads files inside the workspace", async () => {
      const { root, workspace } =
        await createWorkspace();
  
      await writeFile(
        join(root, "example.txt"),
        "hello factory",
        "utf8",
      );
  
      const content =
        await workspace.read("example.txt");
  
      expect(content).toBe("hello factory");
    });
  
    it("writes files inside the workspace", async () => {
      const { root, workspace } =
        await createWorkspace();
  
      await workspace.write(
        "lib/example.txt",
        "generated content",
      );
  
      const content = await readFile(
        join(root, "lib", "example.txt"),
        "utf8",
      );
  
      expect(content).toBe("generated content");
    });
  
    it("deletes files inside the workspace", async () => {
      const { root, workspace } =
        await createWorkspace();
  
      await writeFile(
        join(root, "delete-me.txt"),
        "temporary",
        "utf8",
      );
  
      await workspace.delete("delete-me.txt");
  
      await expect(
        readFile(
          join(root, "delete-me.txt"),
          "utf8",
        ),
      ).rejects.toThrow();
    });
  
    it("rejects paths that escape the workspace", async () => {
      const { workspace } =
        await createWorkspace();
  
      await expect(
        workspace.read("../outside.txt"),
      ).rejects.toThrow(
        "Path escapes workspace: ../outside.txt",
      );
    });
  
    it("rejects absolute paths", async () => {
      const { workspace } =
        await createWorkspace();
  
      await expect(
        workspace.read("/tmp/outside.txt"),
      ).rejects.toThrow(
        "Workspace paths must be relative.",
      );
    });
  
    it("rejects empty paths", async () => {
      const { workspace } =
        await createWorkspace();
  
      await expect(
        workspace.read("   "),
      ).rejects.toThrow(
        "Workspace path cannot be empty.",
      );
    });
  
    it("rejects symlinks that escape the workspace", async () => {
      const { root, workspace } =
        await createWorkspace();
  
      const outsideRoot = await mkdtemp(
        join(tmpdir(), "factory-outside-test-"),
      );
  
      await writeFile(
        join(outsideRoot, "secret.txt"),
        "outside workspace",
        "utf8",
      );
  
      await symlink(
        outsideRoot,
        join(root, "outside-link"),
      );
  
      await expect(
        workspace.read(
          "outside-link/secret.txt",
        ),
      ).rejects.toThrow(
        "Symlink escapes workspace: outside-link/secret.txt",
      );
    });
  
    it("allows symlinks that remain inside the workspace", async () => {
      const { root, workspace } =
        await createWorkspace();
  
      await writeFile(
        join(root, "real-file.txt"),
        "safe content",
        "utf8",
      );
  
      await symlink(
        join(root, "real-file.txt"),
        join(root, "safe-link.txt"),
      );
  
      const content =
        await workspace.read("safe-link.txt");
  
      expect(content).toBe("safe content");
    });
  });