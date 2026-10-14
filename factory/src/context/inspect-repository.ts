import { resolve } from "node:path";

import { scanRepository } from "./repository.js";

async function main() {
  const repositoryRoot = resolve("..");

  const snapshot = await scanRepository(repositoryRoot);

  console.log(`Repository: ${snapshot.root}`);
  console.log(`Files discovered: ${snapshot.files.length}`);
  console.log("");

  for (const file of snapshot.files) {
    console.log(file.path);
  }
}

main().catch((error) => {
  console.error("Repository inspection failed:", error);
  process.exitCode = 1;
});