import type {
    BenchmarkFixture,
  } from "./benchmark-fixture-manager.js";
  
  export const trackHireStatusSummaryFixture:
    BenchmarkFixture = {
      path:
        "test/factory_benchmark_status_summary_test.dart",
  
      content: String.raw`
  import 'package:flutter_test/flutter_test.dart';
  import 'package:trackhire/models/job_application.dart';
  import 'package:trackhire/providers/application_provider.dart';
  
  JobApplication createApplication({
    required String company,
    required String status,
  }) {
    return JobApplication(
      company: company,
      role: 'Engineer',
      status: status,
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
  }
  
  void main() {
    group('counts-statuses', () {
      test(
        'provider counts applications by status',
        () {
          final provider =
              ApplicationProvider();
  
          provider.applications = [
            createApplication(
              company: 'Applied One',
              status: 'Applied',
            ),
            createApplication(
              company: 'Applied Two',
              status: 'Applied',
            ),
            createApplication(
              company: 'Interview',
              status: 'Interviewing',
            ),
            createApplication(
              company: 'Offer',
              status: 'Offer',
            ),
          ];
  
          final summary =
              provider.statusSummary;
  
          expect(
            summary['Applied'],
            2,
          );
  
          expect(
            summary['Interviewing'],
            1,
          );
  
          expect(
            summary['Offer'],
            1,
          );
        },
      );
    });
  
    group('zero-counts', () {
      test(
        'provider returns zero for statuses with no applications',
        () {
          final provider =
              ApplicationProvider();
  
          provider.applications = [
            createApplication(
              company: 'Applied',
              status: 'Applied',
            ),
          ];
  
          final summary =
              provider.statusSummary;
  
          expect(
            summary['Interviewing'],
            0,
          );
  
          expect(
            summary['Offer'],
            0,
          );
  
          expect(
            summary['Rejected'],
            0,
          );
        },
      );
    });
  
    group('updates-summary', () {
      test(
        'summary reflects application collection changes',
        () {
          final provider =
              ApplicationProvider();
  
          provider.applications = [
            createApplication(
              company: 'First',
              status: 'Applied',
            ),
          ];
  
          expect(
            provider.statusSummary[
              'Applied'
            ],
            1,
          );
  
          provider.applications = [
            createApplication(
              company: 'First',
              status: 'Applied',
            ),
            createApplication(
              company: 'Second',
              status: 'Applied',
            ),
            createApplication(
              company: 'Third',
              status: 'Interviewing',
            ),
          ];
  
          expect(
            provider.statusSummary[
              'Applied'
            ],
            2,
          );
  
          expect(
            provider.statusSummary[
              'Interviewing'
            ],
            1,
          );
        },
      );
    });
  
    group('all-statuses', () {
      test(
        'summary contains every supported status',
        () {
          final provider =
              ApplicationProvider();
  
          provider.applications = [];
  
          final summary =
              provider.statusSummary;
  
          expect(
            summary.containsKey(
              'Applied',
            ),
            isTrue,
          );
  
          expect(
            summary.containsKey(
              'Interviewing',
            ),
            isTrue,
          );
  
          expect(
            summary.containsKey(
              'Offer',
            ),
            isTrue,
          );
  
          expect(
            summary.containsKey(
              'Rejected',
            ),
            isTrue,
          );
        },
      );
    });
  }
  `,
    };