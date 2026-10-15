import {
    describe,
    expect,
    it,
  } from "vitest";
  import {
    validateWorkGraph,
    type WorkGraph,
  } from "./work-graph.js";
  
  describe("validateWorkGraph", () => {
    it("accepts independent work units", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the domain model.",
            files: ["lib/models/job_application.dart"],
            dependsOn: [],
          },
          {
            id: "tests",
            description: "Add model tests.",
            files: ["test/job_application_test.dart"],
            dependsOn: [],
          },
        ],
      };
  
      expect(validateWorkGraph(graph)).toEqual({
        valid: true,
        errors: [],
      });
    });
  
    it("accepts valid dependencies", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/job_application.dart"],
            dependsOn: [],
          },
          {
            id: "ui",
            description: "Display the new field.",
            files: ["lib/screens/example.dart"],
            dependsOn: ["model"],
          },
        ],
      };
  
      expect(validateWorkGraph(graph)).toEqual({
        valid: true,
        errors: [],
      });
    });
  
    it("rejects unknown dependencies", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "ui",
            description: "Update the UI.",
            files: ["lib/screens/example.dart"],
            dependsOn: ["missing"],
          },
        ],
      };
  
      const result = validateWorkGraph(graph);
  
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Work unit ui depends on unknown unit missing.",
      );
    });
  
    it("rejects self dependencies", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/job_application.dart"],
            dependsOn: ["model"],
          },
        ],
      };
  
      const result = validateWorkGraph(graph);
  
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Work unit model cannot depend on itself.",
      );
    });
  
    it("rejects duplicate work unit ids", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "First model change.",
            files: ["lib/models/a.dart"],
            dependsOn: [],
          },
          {
            id: "model",
            description: "Second model change.",
            files: ["lib/models/b.dart"],
            dependsOn: [],
          },
        ],
      };
  
      const result = validateWorkGraph(graph);
  
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Duplicate work unit id: model",
      );
    });
  
    it("rejects dependency cycles", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/example.dart"],
            dependsOn: ["provider"],
          },
          {
            id: "provider",
            description: "Update the provider.",
            files: ["lib/providers/example.dart"],
            dependsOn: ["model"],
          },
        ],
      };
  
      const result = validateWorkGraph(graph);
  
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Work graph contains a dependency cycle.",
      );
    });
  
    it("rejects concurrent work units that modify the same file", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model-a",
            description: "Update one part of the model.",
            files: ["lib/models/job_application.dart"],
            dependsOn: [],
          },
          {
            id: "model-b",
            description: "Update another part of the model.",
            files: ["lib/models/job_application.dart"],
            dependsOn: [],
          },
        ],
      };
  
      const result = validateWorkGraph(graph);
  
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Concurrent work units model-a and model-b both modify lib/models/job_application.dart.",
      );
    });
  
    it("allows ordered work units to modify the same file", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Add the model field.",
            files: ["lib/models/job_application.dart"],
            dependsOn: [],
          },
          {
            id: "serialization",
            description: "Update model serialization.",
            files: ["lib/models/job_application.dart"],
            dependsOn: ["model"],
          },
        ],
      };
  
      expect(validateWorkGraph(graph)).toEqual({
        valid: true,
        errors: [],
      });
    });
  });