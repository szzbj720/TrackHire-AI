import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireInterviewDateFixture,
  } from "./trackhire-interview-date-fixture.js";
  
  describe(
    "TrackHire interview date benchmark fixture",
    () => {
      it("uses a benchmark-owned test path outside the agent implementation scope", () => {
        expect(
          trackHireInterviewDateFixture.path,
        ).toBe(
          "test/factory_benchmark_interview_date_test.dart",
        );
      });
  
      it("requires interview date to remain optional", () => {
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "application.interviewDate",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "isNull",
        );
      });
  
      it("requires database and API persistence", () => {
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "toDatabaseJson",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "fromDatabaseJson",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "toApiJson",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "fromApiJson",
        );
      });
  
      it("requires upcoming interview behavior", () => {
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "upcomingInterviews",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "'Sooner'",
        );
  
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "'Later'",
        );
      });
  
      it("requires an interview date input in the add or edit flow", () => {
        expect(
          trackHireInterviewDateFixture
            .content,
        ).toContain(
          "find.text('Interview Date')",
        );
      });
    },
  );