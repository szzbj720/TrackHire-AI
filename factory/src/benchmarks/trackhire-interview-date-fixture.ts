import type {
    BenchmarkFixture,
  } from "./benchmark-fixture-manager.js";
  
  export const trackHireInterviewDateFixture:
    BenchmarkFixture = {
      path:
        "test/factory_benchmark_interview_date_test.dart",
  
      content: String.raw`
  import 'package:flutter/material.dart';
  import 'package:flutter_test/flutter_test.dart';
  import 'package:provider/provider.dart';
  import 'package:trackhire/models/job_application.dart';
  import 'package:trackhire/providers/application_provider.dart';
  import 'package:trackhire/screens/add_edit_job_screen.dart';
  
  void main() {
    group('Factory benchmark: interview date', () {
      test(
        'job application supports no interview date',
        () {
          final application = JobApplication(
            id: 1,
            company: 'OpenAI',
            role: 'Software Engineer',
            status: 'Applied',
            dateApplied: '2026-10-01',
            location: 'San Francisco',
            salaryRange: '',
            notes: '',
            hasResume: false,
            hasPortfolio: false,
            hasCoverLetter: false,
            hasApplicationQuestions: false,
            hasOther: false,
            isSaved: false,
          );
  
          expect(
            application.interviewDate,
            isNull,
          );
        },
      );
  
      test(
        'database serialization preserves interview date',
        () {
          final application = JobApplication(
            id: 1,
            company: 'OpenAI',
            role: 'Software Engineer',
            status: 'Interviewing',
            dateApplied: '2026-10-01',
            interviewDate: '2026-10-25',
            location: 'San Francisco',
            salaryRange: '',
            notes: '',
            hasResume: false,
            hasPortfolio: false,
            hasCoverLetter: false,
            hasApplicationQuestions: false,
            hasOther: false,
            isSaved: false,
          );
  
          final encoded =
              application.toDatabaseJson();
  
          final decoded =
              JobApplication.fromDatabaseJson(
            encoded,
          );
  
          expect(
            decoded.interviewDate,
            '2026-10-25',
          );
        },
      );
  
      test(
        'API serialization preserves interview date',
        () {
          final application = JobApplication(
            id: 1,
            company: 'OpenAI',
            role: 'Software Engineer',
            status: 'Interviewing',
            dateApplied: '2026-10-01',
            interviewDate: '2026-10-25',
            location: 'San Francisco',
            salaryRange: '',
            notes: '',
            hasResume: false,
            hasPortfolio: false,
            hasCoverLetter: false,
            hasApplicationQuestions: false,
            hasOther: false,
            isSaved: false,
          );
  
          final encoded =
              application.toApiJson();
  
          final decoded =
              JobApplication.fromApiJson({
            ...encoded,
            'id': 1,
          });
  
          expect(
            decoded.interviewDate,
            '2026-10-25',
          );
        },
      );
  
      test(
        'upcoming interviews are future dates in chronological order',
        () {
          final provider =
              ApplicationProvider();
  
          final applications = [
            JobApplication(
              id: 1,
              company: 'Later',
              role: 'Engineer',
              status: 'Interviewing',
              dateApplied: '2026-10-01',
              interviewDate: '2099-12-20',
              location: '',
              salaryRange: '',
              notes: '',
              hasResume: false,
              hasPortfolio: false,
              hasCoverLetter: false,
              hasApplicationQuestions: false,
              hasOther: false,
              isSaved: false,
            ),
            JobApplication(
              id: 2,
              company: 'Sooner',
              role: 'Engineer',
              status: 'Interviewing',
              dateApplied: '2026-10-01',
              interviewDate: '2099-11-10',
              location: '',
              salaryRange: '',
              notes: '',
              hasResume: false,
              hasPortfolio: false,
              hasCoverLetter: false,
              hasApplicationQuestions: false,
              hasOther: false,
              isSaved: false,
            ),
            JobApplication(
              id: 3,
              company: 'No Interview',
              role: 'Engineer',
              status: 'Applied',
              dateApplied: '2026-10-01',
              location: '',
              salaryRange: '',
              notes: '',
              hasResume: false,
              hasPortfolio: false,
              hasCoverLetter: false,
              hasApplicationQuestions: false,
              hasOther: false,
              isSaved: false,
            ),
          ];
  
          provider.setApplicationsForTesting(
            applications,
          );
  
          final upcoming =
              provider.upcomingInterviews;
  
          expect(
            upcoming.map(
              (application) =>
                  application.company,
            ),
            [
              'Sooner',
              'Later',
            ],
          );
        },
      );
  
      testWidgets(
        'add application flow exposes optional interview date input',
        (tester) async {
          final provider =
              ApplicationProvider();
  
          await tester.pumpWidget(
            ChangeNotifierProvider<
                ApplicationProvider>.value(
              value: provider,
              child: const MaterialApp(
                home: AddEditJobScreen(),
              ),
            ),
          );
  
          expect(
            find.text('Interview Date'),
            findsOneWidget,
          );
        },
      );
    });
  }
  `,
    };