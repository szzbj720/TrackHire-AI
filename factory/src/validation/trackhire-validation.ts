import { ProcessCommandRunner } from "./command-runner.js";
import {
  DeterministicValidator,
  type ValidationCommand,
} from "./validator.js";

export const trackHireValidationCommands: ValidationCommand[] = [
  {
    name: "Flutter analyze",
    command: "flutter",
    args: ["analyze"],
  },
  {
    name: "Flutter tests",
    command: "flutter",
    args: ["test"],
  },
];

export function createTrackHireValidator(): DeterministicValidator {
  return new DeterministicValidator(
    new ProcessCommandRunner(),
    trackHireValidationCommands,
  );
}