import {
    describe,
    expect,
    it,
  } from "vitest";
  import type { WorkGraph } from "../schemas/work-graph.js";
  import { scheduleWorkGraph } from "./work-graph-scheduler.js";
  
  describe("scheduleWorkGraph", () => {
    it("schedules independent work units in the same wave", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/example.dart"],
            dependsOn: [],
          },
          {
            id: "backend",
            description: "Update the backend.",
            files: ["backend/example.ts"],
            dependsOn: [],
          },
        ],
      };
  
      const schedule = scheduleWorkGraph(graph);
  
      expect(
        schedule.waves.map((wave) =>
          wave.map((unit) => unit.id),
        ),
      ).toEqual([
        ["model", "backend"],
      ]);
    });
  
    it("places dependent work in a later wave", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/example.dart"],
            dependsOn: [],
          },
          {
            id: "ui",
            description: "Update the UI.",
            files: ["lib/screens/example.dart"],
            dependsOn: ["model"],
          },
        ],
      };
  
      const schedule = scheduleWorkGraph(graph);
  
      expect(
        schedule.waves.map((wave) =>
          wave.map((unit) => unit.id),
        ),
      ).toEqual([
        ["model"],
        ["ui"],
      ]);
    });
  
    it("waits for multiple dependencies before scheduling a work unit", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/example.dart"],
            dependsOn: [],
          },
          {
            id: "backend",
            description: "Update the backend.",
            files: ["backend/example.ts"],
            dependsOn: [],
          },
          {
            id: "ui",
            description: "Update the UI.",
            files: ["lib/screens/example.dart"],
            dependsOn: [
              "model",
              "backend",
            ],
          },
        ],
      };
  
      const schedule = scheduleWorkGraph(graph);
  
      expect(
        schedule.waves.map((wave) =>
          wave.map((unit) => unit.id),
        ),
      ).toEqual([
        ["model", "backend"],
        ["ui"],
      ]);
    });
  
    it("schedules a longer dependency chain in order", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "model",
            description: "Update the model.",
            files: ["lib/models/example.dart"],
            dependsOn: [],
          },
          {
            id: "provider",
            description: "Update the provider.",
            files: ["lib/providers/example.dart"],
            dependsOn: ["model"],
          },
          {
            id: "ui",
            description: "Update the UI.",
            files: ["lib/screens/example.dart"],
            dependsOn: ["provider"],
          },
        ],
      };
  
      const schedule = scheduleWorkGraph(graph);
  
      expect(
        schedule.waves.map((wave) =>
          wave.map((unit) => unit.id),
        ),
      ).toEqual([
        ["model"],
        ["provider"],
        ["ui"],
      ]);
    });
  
    it("refuses to schedule a graph with no ready work", () => {
      const graph: WorkGraph = {
        units: [
          {
            id: "a",
            description: "Work A.",
            files: ["a.ts"],
            dependsOn: ["b"],
          },
          {
            id: "b",
            description: "Work B.",
            files: ["b.ts"],
            dependsOn: ["a"],
          },
        ],
      };
  
      expect(
        () => scheduleWorkGraph(graph),
      ).toThrow(
        "Cannot schedule work graph because no remaining work units are ready.",
      );
    });
  });