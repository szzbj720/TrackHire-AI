import type {
  FactoryBenchBaselineObservation,
} from "./factory-bench-baseline-snapshot.js";
import {
  FactoryBenchBaselineSnapshot,
} from "./factory-bench-baseline-snapshot.js";

export class FactoryBenchV0Reporter {
  render(
    snapshot: FactoryBenchBaselineSnapshot,
    observations: FactoryBenchBaselineObservation[],
  ): string {
    const summary =
      snapshot.summarize();

    const criterionPassPercentage =
      (
        summary.criterionPassRate * 100
      ).toFixed(1);

    const lines: string[] = [
      "# FactoryBench V0 Baseline",
      "",
      "Historical evidence snapshot",
      "",
      `Scenarios: ${summary.scenarioCount}`,
      `Factory runs: ${summary.factoryRunScenarios}`,
      `Repository controls: ${summary.repositoryControlScenarios}`,
      `Criteria passed: ${summary.passedCriteria}/${summary.totalCriteria} (${criterionPassPercentage}%)`,
      "",
      "## Scenario Observations",
      "",
    ];

    for (
      const observation
      of observations
    ) {
      const revision =
        observation.baselineRevision
        ?? "unknown";

      const validation =
        observation.validationPassed === null
          ? "not recorded"
          : observation.validationPassed
            ? "PASS"
            : "FAIL";

      lines.push(
        [
          observation.scenarioId,
          observation.kind,
          `${observation.passedCriteria}/${observation.totalCriteria} criteria`,
          observation.overallPassed
            ? "PASS"
            : "FAIL",
          `validation: ${validation}`,
          `revision: ${revision}`,
        ].join(" | "),
      );
    }

    lines.push(
      "",
      "Note: Factory runs and repository controls are different forms of historical evidence. This mixed snapshot must not be interpreted as a factory-wide V0 success rate.",
    );

    return lines.join("\n");
  }
}
