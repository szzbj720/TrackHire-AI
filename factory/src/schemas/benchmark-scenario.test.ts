import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    benchmarkScenarioSchema,
    type BenchmarkScenario,
  } from "./benchmark-scenario.js";
  
  function createScenario():
    BenchmarkScenario {
    return {
      id: "trackhire-interview-date",
      name:
        "TrackHire interview date",
  
      description:
        "Add optional interview scheduling support to a real TrackHire application.",
  
      task:
        "Add an optional interview date to a TrackHire application and display upcoming interviews.",
  
      repositoryFiles: [
        "lib/models/job_application.dart",
        "lib/providers/application_provider.dart",
        "lib/screens/add_edit_job_screen.dart",
        "test/job_application_test.dart",
      ],
  
      acceptanceCriteria: [
        {
          id: "optional-date",
          description:
            "A job application can exist without an interview date.",
          verification:
            "Model tests confirm existing applications remain valid when no interview date is present.",
        },
        {
          id: "persist-date",
          description:
            "An interview date survives application serialization and deserialization.",
          verification:
            "Model tests confirm database and API conversions preserve the interview date.",
        },
        {
          id: "edit-date",
          description:
            "Users can add or edit an interview date.",
          verification:
            "The add/edit application flow exposes optional interview date input.",
        },
        {
          id: "upcoming-interviews",
          description:
            "Upcoming interviews can be derived from tracked applications.",
          verification:
            "Provider tests confirm future interview dates are returned in chronological order and applications without upcoming interviews are excluded.",
        },
        {
          id: "regression",
          description:
            "Existing TrackHire behavior remains valid.",
          verification:
            "Flutter analysis and the existing test suite pass.",
        },
      ],
  
      validationCommands: [
        "flutter analyze",
        "flutter test",
      ],
  
      expectedComplexity: "high",
      expectedRisk: "medium",
  
      requiresRealRepository: true,
    };
  }
  
  describe(
    "benchmarkScenarioSchema",
    () => {
      it("accepts the real TrackHire interview-date benchmark", () => {
        const scenario =
          createScenario();
  
        const parsed =
          benchmarkScenarioSchema.parse(
            scenario,
          );
  
        expect(parsed.id).toBe(
          "trackhire-interview-date",
        );
  
        expect(parsed.repositoryFiles).toContain(
          "lib/models/job_application.dart",
        );
  
        expect(
          parsed.acceptanceCriteria,
        ).toHaveLength(5);
  
        expect(
          parsed.validationCommands,
        ).toEqual([
          "flutter analyze",
          "flutter test",
        ]);
  
        expect(
          parsed.requiresRealRepository,
        ).toBe(true);
      });
  
      it("rejects a benchmark without acceptance criteria", () => {
        const scenario =
          createScenario();
  
        expect(() =>
          benchmarkScenarioSchema.parse({
            ...scenario,
            acceptanceCriteria: [],
          }),
        ).toThrow();
      });
  
      it("rejects a benchmark without deterministic validation commands", () => {
        const scenario =
          createScenario();
  
        expect(() =>
          benchmarkScenarioSchema.parse({
            ...scenario,
            validationCommands: [],
          }),
        ).toThrow();
      });
  
      it("rejects an invalid expected complexity", () => {
        const scenario =
          createScenario();
  
        expect(() =>
          benchmarkScenarioSchema.parse({
            ...scenario,
            expectedComplexity:
              "extreme",
          }),
        ).toThrow();
      });
  
      it("rejects an empty repository scope", () => {
        const scenario =
          createScenario();
  
        expect(() =>
          benchmarkScenarioSchema.parse({
            ...scenario,
            repositoryFiles: [],
          }),
        ).toThrow();
      });
    },
  );