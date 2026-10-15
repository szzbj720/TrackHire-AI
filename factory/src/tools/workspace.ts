import {
    lstat,
    mkdir,
    readFile,
    realpath,
    rm,
    writeFile,
  } from "node:fs/promises";
  import {
    dirname,
    isAbsolute,
    relative,
    resolve,
    sep,
  } from "node:path";
  
  export class Workspace {
    constructor(
      private readonly root: string,
    ) {}
  
    getRoot(): string {
      return this.root;
    }
  
    private isInsideRoot(
      root: string,
      candidate: string,
    ): boolean {
      const relativePath = relative(
        root,
        candidate,
      );
  
      return (
        relativePath !== ".." &&
        !relativePath.startsWith(`..${sep}`) &&
        !isAbsolute(relativePath)
      );
    }
  
    private resolveSafePath(path: string): string {
      if (!path.trim()) {
        throw new Error(
          "Workspace path cannot be empty.",
        );
      }
  
      if (isAbsolute(path)) {
        throw new Error(
          "Workspace paths must be relative.",
        );
      }
  
      const resolvedRoot = resolve(this.root);
      const resolvedPath = resolve(
        resolvedRoot,
        path,
      );
  
      if (
        !this.isInsideRoot(
          resolvedRoot,
          resolvedPath,
        )
      ) {
        throw new Error(
          `Path escapes workspace: ${path}`,
        );
      }
  
      return resolvedPath;
    }
  
    private async assertNoSymlinkEscape(
      path: string,
    ): Promise<void> {
      const resolvedRoot = await realpath(
        resolve(this.root),
      );
  
      const safePath = this.resolveSafePath(path);
  
      const relativePath = relative(
        resolve(this.root),
        safePath,
      );
  
      const parts = relativePath
        .split(sep)
        .filter((part) => part.length > 0);
  
      let currentPath = resolvedRoot;
  
      for (const part of parts) {
        currentPath = resolve(
          currentPath,
          part,
        );
  
        try {
          const stats = await lstat(currentPath);
  
          if (stats.isSymbolicLink()) {
            const target = await realpath(
              currentPath,
            );
  
            if (
              !this.isInsideRoot(
                resolvedRoot,
                target,
              )
            ) {
              throw new Error(
                `Symlink escapes workspace: ${path}`,
              );
            }
  
            currentPath = target;
          }
        } catch (error) {
          if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            continue;
          }
  
          throw error;
        }
      }
    }
  
    async read(path: string): Promise<string> {
      const safePath = this.resolveSafePath(path);
  
      await this.assertNoSymlinkEscape(path);
  
      return readFile(safePath, "utf8");
    }
  
    async write(
      path: string,
      content: string,
    ): Promise<void> {
      const safePath = this.resolveSafePath(path);
  
      await this.assertNoSymlinkEscape(path);
  
      await mkdir(dirname(safePath), {
        recursive: true,
      });
  
      await writeFile(
        safePath,
        content,
        "utf8",
      );
    }
  
    async delete(path: string): Promise<void> {
      const safePath = this.resolveSafePath(path);
  
      await this.assertNoSymlinkEscape(path);
  
      await rm(safePath, {
        force: true,
      });
    }
  }