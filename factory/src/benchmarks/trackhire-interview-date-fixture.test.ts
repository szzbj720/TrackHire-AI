import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    trackHireInterviewDateFixture,
  } from "./trackhire-interview-date-fixture.js";
  
  describe(
    "TrackHire interview-date benchmark fixture",
    () => {
      it(
        "uses the protected benchmark test path",
        () => {
          expect(
            trackHireInterviewDateFixture.path,
          ).toBe(
            "test/factory_benchmark_interview_date_test.dart",
          );
        },
      );
  
      it(
        "imports the real TrackHire application surfaces",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "package:trackhire/models/job_application.dart",
          );
  
          expect(
            content,
          ).toContain(
            "package:trackhire/providers/application_provider.dart",
          );
  
          expect(
            content,
          ).toContain(
            "package:trackhire/screens/add_edit_job_screen.dart",
          );
        },
      );
  
      it(
        "satisfies the existing JobApplication constructor contract",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "hasResume: false",
          );
  
          expect(
            content,
          ).toContain(
            "hasPortfolio: false",
          );
  
          expect(
            content,
          ).toContain(
            "hasCoverLetter: false",
          );
  
          expect(
            content,
          ).toContain(
            "hasApplicationQuestions: false",
          );
  
          expect(
            content,
          ).toContain(
            "hasOther: false",
          );
  
          expect(
            content,
          ).toContain(
            "isSaved: false",
          );
        },
      );
  
      it(
        "verifies that interview date remains optional",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "group('optional-date'",
          );
  
          expect(
            content,
          ).toContain(
            "application.interviewDate",
          );
  
          expect(
            content,
          ).toContain(
            "isNull",
          );
        },
      );
  
      it(
        "verifies database and API persistence",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "group('persist-date'",
          );
  
          expect(
            content,
          ).toContain(
            "toDatabaseJson()",
          );
  
          expect(
            content,
          ).toContain(
            "fromDatabaseJson",
          );
  
          expect(
            content,
          ).toContain(
            "toApiJson()",
          );
  
          expect(
            content,
          ).toContain(
            "fromApiJson",
          );
        },
      );
  
      it(
        "verifies upcoming interview ordering without a benchmark-only setter",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "group('upcoming-interviews'",
          );
  
          expect(
            content,
          ).toContain(
            "provider.applications =",
          );
  
          expect(
            content,
          ).toContain(
            "provider.upcomingInterviews",
          );
  
          expect(
            content,
          ).toContain(
            "'Sooner'",
          );
  
          expect(
            content,
          ).toContain(
            "'Later'",
          );
  
          expect(
            content,
          ).not.toContain(
            "setApplicationsForTesting",
          );
        },
      );
  
      it(
        "verifies both add and edit UI expose the interview date",
        () => {
          const content =
            trackHireInterviewDateFixture.content;
  
          expect(
            content,
          ).toContain(
            "group('edit-date'",
          );
  
          expect(
            content,
          ).toContain(
            "const MaterialApp",
          );
  
          expect(
            content,
          ).toContain(
            "application:",
          );
  
          expect(
            content,
          ).toContain(
            "AddEditJobScreen",
          );
  
          expect(
            content,
          ).toContain(
            "find.text(",
          );
  
          expect(
            content,
          ).toContain(
            "'Interview Date'",
          );
        },
      );
    },
  );