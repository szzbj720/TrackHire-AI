import {
  describe,
  expect,
  it,
} from "vitest";

import {
  FactoryBenchV0Reporter,
} from "./factory-bench-v0-reporter.js";
import {
  factoryBenchV0Baseline,
  factoryBenchV0Observations,
} from "./factory-bench-v0-baseline.js";

describe(
  "FactoryBench V0 reporter",
  () => {
    it(
      "reports the historical evidence composition",
      () => {
        const reporter =
          new FactoryBenchV0Reporter();

        const report =
          reporter.render(
            factoryBenchV0Baseline,
            factoryBenchV0Observations,
          );

        expect(report).toContain(
          "FactoryBench V0 Baseline",
        );

        expect(report).toContain(
          "Factory runs: 3",
        );

        expect(report).toContain(
          "Repository controls: 7",
        );
      },
    );

    it(
      "reports weighted criterion results",
      () => {
        const reporter =
          new FactoryBenchV0Reporter();

        const report =
          reporter.render(
            factoryBenchV0Baseline,
            factoryBenchV0Observations,
          );

        expect(report).toContain(
          "Criteria passed: 23/54 (42.6%)",
        );
      },
    );

    it(
      "labels every scenario by observation kind",
      () => {
        const reporter =
          new FactoryBenchV0Reporter();

        const report =
          reporter.render(
            factoryBenchV0Baseline,
            factoryBenchV0Observations,
          );

        expect(report).toContain(
          "trackhire-interview-date | factory-run",
        );

        expect(report).toContain(
          "trackhire-application-source | repository-control",
        );

        expect(report).toContain(
          "trackhire-ambiguous-sorting | factory-run",
        );
      },
    );

    it(
      "does not present mixed observations as factory performance",
      () => {
        const reporter =
          new FactoryBenchV0Reporter();

        const report =
          reporter.render(
            factoryBenchV0Baseline,
            factoryBenchV0Observations,
          );

        expect(report).toContain(
          "Historical evidence snapshot",
        );

        expect(report).not.toContain(
          "Factory success rate: 0.0%",
        );
      },
    );
  },
);
