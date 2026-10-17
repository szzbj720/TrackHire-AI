import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireInterviewDateFixture,
  } from "./trackhire-interview-date-fixture.js";
  
  describe(
    "trackHireInterviewDateFixture",
    () => {
      it("uses a protected benchmark test path", () => {
        expect(
          trackHireInterviewDateFixture.path,
        ).toBe(
          "test/factory_benchmark_interview_date_test.dart",
        );
      });
  
      it("uses the TrackHire package imports", () => {
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "package:trackhire/models/job_application.dart",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "package:trackhire/providers/application_provider.dart",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "package:trackhire/screens/add_edit_job_screen.dart",
        );
      });
  
      it("checks that interview date remains optional", () => {
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "group('optional-date'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "application.interviewDate",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "isNull",
        );
      });
  
      it("checks database and API persistence", () => {
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "group('persist-date'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "toDatabaseJson",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "fromDatabaseJson",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "toApiJson",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "fromApiJson",
        );
      });
  
      it("checks upcoming interview behavior without a testing-only provider API", () => {
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "group('upcoming-interviews'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "provider.applications =",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "provider.upcomingInterviews",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "'Sooner'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "'Later'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).not.toContain(
          "setApplicationsForTesting",
        );
      });
  
      it("checks that the add and edit UI exposes interview date", () => {
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "group('edit-date'",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "AddEditJobScreen",
        );
  
        expect(
          trackHireInterviewDateFixture.content,
        ).toContain(
          "find.text('Interview Date')",
        );
      });
    },
  );