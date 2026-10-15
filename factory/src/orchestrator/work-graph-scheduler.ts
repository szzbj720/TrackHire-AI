import type {
    WorkGraph,
    WorkUnit,
  } from "../schemas/work-graph.js";
  
  export interface WorkGraphSchedule {
    waves: WorkUnit[][];
  }
  
  export function scheduleWorkGraph(
    graph: WorkGraph,
  ): WorkGraphSchedule {
    const completed = new Set<string>();
    const remaining = new Map(
      graph.units.map((unit) => [
        unit.id,
        unit,
      ]),
    );
  
    const waves: WorkUnit[][] = [];
  
    while (remaining.size > 0) {
      const ready = Array.from(
        remaining.values(),
      ).filter((unit) =>
        unit.dependsOn.every((dependency) =>
          completed.has(dependency),
        ),
      );
  
      if (ready.length === 0) {
        throw new Error(
          "Cannot schedule work graph because no remaining work units are ready.",
        );
      }
  
      waves.push(ready);
  
      for (const unit of ready) {
        completed.add(unit.id);
        remaining.delete(unit.id);
      }
    }
  
    return { waves };
  }