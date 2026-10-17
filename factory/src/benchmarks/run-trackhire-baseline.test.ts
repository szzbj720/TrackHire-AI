import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    readFile,
  } from "node:fs/promises";
  
  import {
    fileURLToPath,
  } from "node:url";
  
  async function readEntryPoint():
    Promise<string> {
    const path =
      fileURLToPath(
        new URL(
          "./run-trackhire-baseline.ts",
          import.meta.url,
        ),
      );
  
    return readFile(
      path,
      "utf8",
    );
  }
  
  describe(
    "real TrackHire baseline entry point",
    () => {
      it("uses the real benchmark infrastructure", async () => {
        const source =
          await readEntryPoint();
  
        expect(
          source,
        ).toContain(
          "new BenchmarkWorkspaceManager()",
        );
  
        expect(
          source,
        ).toContain(
          "new BenchmarkTaskAdapter()",
        );
  
        expect(
          source,
        ).toContain(
          "new TrackHireBaseline()",
        );
      });
  
      it("does not inject a fake command runner", async () => {
        const source =
          await readEntryPoint();
  
        expect(
          source,
        ).not.toContain(
          "FakeCommandRunner",
        );
  
        expect(
          source,
        ).not.toContain(
          "BaselineCommandRunner",
        );
      });
  
      it("uses HEAD as the baseline input before immutable resolution", async () => {
        const source =
          await readEntryPoint();
  
        expect(
          source,
        ).toMatch(
          /baseRevision:\s*"HEAD"/,
        );
  
        expect(
          source,
        ).toContain(
          "workspace.baselineRevision",
        );
      });
  
      it("requires the untouched feature criteria to fail", async () => {
        const source =
          await readEntryPoint();
  
        expect(
          source,
        ).toContain(
          '"optional-date"',
        );
  
        expect(
          source,
        ).toContain(
          '"persist-date"',
        );
  
        expect(
          source,
        ).toContain(
          '"upcoming-interviews"',
        );
  
        expect(
          source,
        ).toContain(
          '"edit-date"',
        );
  
        expect(
          source,
        ).toContain(
          "unexpectedFeaturePasses",
        );
      });
    },
  );