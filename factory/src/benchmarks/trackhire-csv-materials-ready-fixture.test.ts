import { describe, expect, it } from "vitest";

import { trackHireCsvMaterialsReadyExportFixture } from "./trackhire-csv-materials-ready-export-fixture.js";
import { trackHireCsvMaterialsReadyFixture } from "./trackhire-csv-materials-ready-fixture.js";

describe("TrackHire CSV materials-ready fixtures", () => {
  it("installs the held-out Dart model-count fixture", () => {
    expect(trackHireCsvMaterialsReadyFixture.path).toBe(
      "test/factory_benchmark_csv_materials_ready_test.dart",
    );

    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "checklistCompletedCount",
    );
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "reports zero completed materials",
    );
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "reports partially completed materials",
    );
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "reports all completed materials",
    );
  });

  it("covers zero, partial, and complete material counts", () => {
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "expect(application.checklistCompletedCount, 0)",
    );
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "expect(application.checklistCompletedCount, 3)",
    );
    expect(trackHireCsvMaterialsReadyFixture.content).toContain(
      "expect(application.checklistCompletedCount, 5)",
    );
  });

  it("installs the protected CSV export contract fixture", () => {
    expect(trackHireCsvMaterialsReadyExportFixture.path).toBe(
      "factory_benchmark_csv_materials_ready_test.js",
    );

    expect(trackHireCsvMaterialsReadyExportFixture.content).toContain(
      "Materials Ready",
    );
    expect(trackHireCsvMaterialsReadyExportFixture.content).toContain(
      "checklistCompletedCount",
    );
    expect(trackHireCsvMaterialsReadyExportFixture.content).toContain(
      "existingHeaders",
    );
    expect(trackHireCsvMaterialsReadyExportFixture.content).toContain(
      "existingValues",
    );
  });
});