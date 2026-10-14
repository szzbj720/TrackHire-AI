import {
    mkdir,
    readFile,
    rm,
    writeFile,
  } from "node:fs/promises";
  import {
    dirname,
    isAbsolute,
    relative,
    resolve,
  } from "node:path";
  
  export class Workspace {
    constructor(
      private readonly root: string,
    ) {}
  
    getRoot(): string {
      return this.root;
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
  
      const relativePath = relative(
        resolvedRoot,
        resolvedPath,
      );
  
      if (
        relativePath === ".." ||
        relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
        isAbsolute(relativePath)
      ) {
        throw new Error(
          `Path escapes workspace: ${path}`,
        );
      }
  
      return resolvedPath;
    }
  
    async read(path: string): Promise<string> {
      const safePath = this.resolveSafePath(path);
  
      return readFile(safePath, "utf8");
    }
  
    async write(
      path: string,
      content: string,
    ): Promise<void> {
      const safePath = this.resolveSafePath(path);
  
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
  
      await rm(safePath, {
        force: true,
      });
    }
  }