export interface WorkUnit {
    id: string;
    description: string;
    files: string[];
    dependsOn: string[];
  }
  
  export interface WorkGraph {
    units: WorkUnit[];
  }
  
  export interface WorkGraphValidationResult {
    valid: boolean;
    errors: string[];
  }
  
  export function validateWorkGraph(
    graph: WorkGraph,
  ): WorkGraphValidationResult {
    const errors: string[] = [];
    const ids = new Set<string>();
  
    for (const unit of graph.units) {
      if (ids.has(unit.id)) {
        errors.push(
          `Duplicate work unit id: ${unit.id}`,
        );
      }
  
      ids.add(unit.id);
    }
  
    for (const unit of graph.units) {
      for (const dependency of unit.dependsOn) {
        if (!ids.has(dependency)) {
          errors.push(
            `Work unit ${unit.id} depends on unknown unit ${dependency}.`,
          );
        }
  
        if (dependency === unit.id) {
          errors.push(
            `Work unit ${unit.id} cannot depend on itself.`,
          );
        }
      }
    }
  
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }
  
    const visiting = new Set<string>();
    const visited = new Set<string>();
  
    const unitsById = new Map(
      graph.units.map((unit) => [
        unit.id,
        unit,
      ]),
    );
  
    const hasCycle = (id: string): boolean => {
      if (visiting.has(id)) {
        return true;
      }
  
      if (visited.has(id)) {
        return false;
      }
  
      visiting.add(id);
  
      const unit = unitsById.get(id);
  
      if (unit) {
        for (const dependency of unit.dependsOn) {
          if (hasCycle(dependency)) {
            return true;
          }
        }
      }
  
      visiting.delete(id);
      visited.add(id);
  
      return false;
    };
  
    for (const unit of graph.units) {
      if (hasCycle(unit.id)) {
        errors.push(
          "Work graph contains a dependency cycle.",
        );
        break;
      }
    }
  
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }
  
    const dependsTransitivelyOn = (
      unitId: string,
      targetId: string,
      checked = new Set<string>(),
    ): boolean => {
      if (checked.has(unitId)) {
        return false;
      }
  
      checked.add(unitId);
  
      const unit = unitsById.get(unitId);
  
      if (!unit) {
        return false;
      }
  
      for (const dependency of unit.dependsOn) {
        if (dependency === targetId) {
          return true;
        }
  
        if (
          dependsTransitivelyOn(
            dependency,
            targetId,
            checked,
          )
        ) {
          return true;
        }
      }
  
      return false;
    };
  
    for (
      let firstIndex = 0;
      firstIndex < graph.units.length;
      firstIndex += 1
    ) {
      const first = graph.units[firstIndex];
  
      if (!first) {
        continue;
      }
  
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < graph.units.length;
        secondIndex += 1
      ) {
        const second = graph.units[secondIndex];
  
        if (!second) {
          continue;
        }
  
        const ordered =
          dependsTransitivelyOn(
            first.id,
            second.id,
          ) ||
          dependsTransitivelyOn(
            second.id,
            first.id,
          );
  
        if (ordered) {
          continue;
        }
  
        const firstFiles = new Set(
          first.files,
        );
  
        const conflictingFiles =
          second.files.filter((file) =>
            firstFiles.has(file),
          );
  
        for (const file of conflictingFiles) {
          errors.push(
            `Concurrent work units ${first.id} and ${second.id} both modify ${file}.`,
          );
        }
      }
    }
  
    return {
      valid: errors.length === 0,
      errors,
    };
  }