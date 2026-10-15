import type {
    ImplementationResult,
  } from "../schemas/implementation.js";
  
  export function combineImplementationEvidence(
    implementation: ImplementationResult,
    repairs: ImplementationResult[],
  ): ImplementationResult {
    const results = [
      implementation,
      ...repairs,
    ];
  
    const changedFilesByPath =
      new Map<
        string,
        ImplementationResult["changedFiles"][number]
      >();
  
    for (const result of results) {
      for (const change of result.changedFiles) {
        changedFilesByPath.set(
          change.path,
          change,
        );
      }
    }
  
    return {
      summary: [
        implementation.summary,
        ...repairs.map(
          (repair) => repair.summary,
        ),
      ].join(" "),
      changedFiles: [
        ...changedFilesByPath.values(),
      ],
      commandsRun: results.flatMap(
        (result) => result.commandsRun,
      ),
      assumptions: [
        ...new Set(
          results.flatMap(
            (result) => result.assumptions,
          ),
        ),
      ],
      warnings: [
        ...new Set(
          results.flatMap(
            (result) => result.warnings,
          ),
        ),
      ],
      requiresHumanInput:
        results.some(
          (result) =>
            result.requiresHumanInput,
        ),
    };
  }