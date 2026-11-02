import {
  factoryBenchV0Baseline,
  factoryBenchV0Observations,
} from "./factory-bench-v0-baseline.js";
import {
  FactoryBenchV0Reporter,
} from "./factory-bench-v0-reporter.js";

const reporter =
  new FactoryBenchV0Reporter();

const report =
  reporter.render(
    factoryBenchV0Baseline,
    factoryBenchV0Observations,
  );

console.log(report);
