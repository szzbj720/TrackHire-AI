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
  
  JobApplication createApplication({
    required String company,
    String status = 'Applied',
    String? interviewDate,
  }) {
    return JobApplication(
      company: company,
      role: 'Engineer',
      status: status,
      dateApplied: '2026-10-01',
      interviewDate: interviewDate,
      location: 'Remote',
      salaryRange: '',
      notes: '',
      hasResume: false,
      hasPortfolio: false,
      hasCoverLetter: false,
      hasApplicationQuestions: false,
      hasOther: false,
      isSaved: false,
    );
  }
  
  void main() {
    group('optional-date', () {
      test('interview date is optional', () {
        final application = JobApplication(
          company: 'Acme',
          role: 'Engineer',
          status: 'Applied',
          dateApplied: '2026-10-01',
          location: 'Remote',
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
      });
    });
  
    group('persist-date', () {
      test(
        'database serialization preserves interview date',
        () {
          final application =
              createApplication(
            company: 'Acme',
            status: 'Interviewing',
            interviewDate: '2026-10-25',
          );
  
          final databaseJson =
              application.toDatabaseJson();
  
          expect(
            databaseJson['interviewDate'],
            '2026-10-25',
          );
  
          final restored =
              JobApplication.fromDatabaseJson(
            databaseJson,
          );
  
          expect(
            restored.interviewDate,
            '2026-10-25',
          );
        },
      );
  
      test(
        'API serialization preserves interview date',
        () {
          final application =
              createApplication(
            company: 'Acme',
            status: 'Interviewing',
            interviewDate: '2026-10-25',
          );
  
          final apiJson =
              application.toApiJson();
  
          expect(
            apiJson['interviewDate'],
            '2026-10-25',
          );
  
          final restored =
              JobApplication.fromApiJson(
            apiJson,
          );
  
          expect(
            restored.interviewDate,
            '2026-10-25',
          );
        },
      );
    });
  
    group('upcoming-interviews', () {
      test(
        'provider returns upcoming interviews in chronological order',
        () {
          final provider =
              ApplicationProvider();
  
          provider.applications = [
            createApplication(
              company: 'Later',
              status: 'Interviewing',
              interviewDate: '2099-12-20',
            ),
            createApplication(
              company: 'No Interview',
            ),
            createApplication(
              company: 'Sooner',
              status: 'Interviewing',
              interviewDate: '2099-12-10',
            ),
          ];
  
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
    });
  
    group('edit-date', () {
      testWidgets(
        'add screen exposes interview date',
        (tester) async {
          final provider =
              ApplicationProvider();
  
          await tester.pumpWidget(
            ChangeNotifierProvider<
                ApplicationProvider>.value(
              value: provider,
              child: const MaterialApp(
                home:
                    AddEditJobScreen(),
              ),
            ),
          );
  
          expect(
            find.text(
              'Interview Date',
            ),
            findsOneWidget,
          );
        },
      );
  
      testWidgets(
        'edit screen exposes interview date',
        (tester) async {
          final provider =
              ApplicationProvider();
  
          final application =
              createApplication(
            company: 'Acme',
            status: 'Interviewing',
            interviewDate: '2099-12-10',
          );
  
          await tester.pumpWidget(
            ChangeNotifierProvider<
                ApplicationProvider>.value(
              value: provider,
              child: MaterialApp(
                home:
                    AddEditJobScreen(
                  application:
                      application,
                ),
              ),
            ),
          );
  
          expect(
            find.text(
              'Interview Date',
            ),
            findsOneWidget,
          );
        },
      );
    });
  }
  `,
    };