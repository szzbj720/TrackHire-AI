import type {
    BenchmarkFixture,
  } from "./benchmark-fixture-manager.js";
  
  export const trackHireApplicationSourceFixture:
    BenchmarkFixture = {
      path:
        "test/factory_benchmark_application_source_test.dart",
  
      content: String.raw`
  import 'package:flutter_test/flutter_test.dart';
  import 'package:trackhire/models/job_application.dart';
  
  JobApplication createApplication({
    String? source,
  }) {
    return JobApplication(
      company: 'FactoryBench',
      role: 'Software Engineer',
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
      source: source,
    );
  }
  
  void main() {
    group('optional-source', () {
      test(
        'application supports no source',
        () {
          final application =
              createApplication();
  
          expect(
            application.source,
            isNull,
          );
        },
      );
    });
  
    group('serialize-source', () {
      test(
        'API serialization preserves source',
        () {
          final application =
              createApplication(
            source: 'LinkedIn',
          );
  
          final json =
              application.toApiJson();
  
          expect(
            json['source'],
            'LinkedIn',
          );
        },
      );
  
      test(
        'API deserialization preserves source',
        () {
          final application =
              JobApplication.fromApiJson({
            'id': 42,
            'company': 'FactoryBench',
            'role': 'Software Engineer',
            'status': 'Applied',
            'dateApplied': '2026-10-01',
            'location': 'Remote',
            'salaryRange': '',
            'notes': '',
            'hasResume': false,
            'hasPortfolio': false,
            'hasCoverLetter': false,
            'hasApplicationQuestions': false,
            'hasOther': false,
            'isSaved': false,
            'source': 'Referral',
          });
  
          expect(
            application.source,
            'Referral',
          );
        },
      );
  
      test(
        'missing API source remains valid',
        () {
          final application =
              JobApplication.fromApiJson({
            'id': 42,
            'company': 'FactoryBench',
            'role': 'Software Engineer',
            'status': 'Applied',
            'dateApplied': '2026-10-01',
            'location': 'Remote',
            'salaryRange': '',
            'notes': '',
            'hasResume': false,
            'hasPortfolio': false,
            'hasCoverLetter': false,
            'hasApplicationQuestions': false,
            'hasOther': false,
            'isSaved': false,
          });
  
          expect(
            application.source,
            isNull,
          );
        },
      );
    });
  
    group('database-source', () {
      test(
        'database serialization preserves source',
        () {
          final application =
              createApplication(
            source: 'Company Website',
          );
  
          final json =
              application.toDatabaseJson();
  
          expect(
            json['source'],
            'Company Website',
          );
        },
      );
  
      test(
        'database deserialization preserves source',
        () {
          final application =
              JobApplication.fromDatabaseJson({
            'id': 42,
            'company': 'FactoryBench',
            'role': 'Software Engineer',
            'status': 'Applied',
            'dateApplied': '2026-10-01',
            'location': 'Remote',
            'salaryRange': '',
            'notes': '',
            'hasResume': 0,
            'hasPortfolio': 0,
            'hasCoverLetter': 0,
            'hasApplicationQuestions': 0,
            'hasOther': 0,
            'isSaved': 0,
            'source': 'Career Fair',
          });
  
          expect(
            application.source,
            'Career Fair',
          );
        },
      );
  
      test(
        'missing database source remains valid',
        () {
          final application =
              JobApplication.fromDatabaseJson({
            'id': 42,
            'company': 'FactoryBench',
            'role': 'Software Engineer',
            'status': 'Applied',
            'dateApplied': '2026-10-01',
            'location': 'Remote',
            'salaryRange': '',
            'notes': '',
            'hasResume': 0,
            'hasPortfolio': 0,
            'hasCoverLetter': 0,
            'hasApplicationQuestions': 0,
            'hasOther': 0,
            'isSaved': 0,
          });
  
          expect(
            application.source,
            isNull,
          );
        },
      );
    });
  }
  `,
    };