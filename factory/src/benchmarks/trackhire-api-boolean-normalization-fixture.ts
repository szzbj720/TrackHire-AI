import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireApiBooleanNormalizationFixture: BenchmarkFixture = {
  path: "test/factory_benchmark_api_boolean_normalization_test.dart",
  content: `import 'package:flutter_test/flutter_test.dart';
import 'package:trackhire/models/job_application.dart';

void main() {
  group('integer-booleans', () {
    test('accepts SQLite-style integer boolean values from API JSON', () {
      final application = JobApplication.fromApiJson({
        'id': 1,
        'company': 'FactoryBench',
        'role': 'Software Engineer',
        'status': 'Interviewing',
        'hasResume': 1,
        'hasPortfolio': 0,
        'hasCoverLetter': 1,
        'hasApplicationQuestions': 0,
        'hasOther': 1,
        'isSaved': 0,
      });

      expect(application.hasResume, isTrue);
      expect(application.hasPortfolio, isFalse);
      expect(application.hasCoverLetter, isTrue);
      expect(application.hasApplicationQuestions, isFalse);
      expect(application.hasOther, isTrue);
      expect(application.isSaved, isFalse);
    });
  });

  group('native-booleans', () {
    test('continues to accept native boolean values from API JSON', () {
      final application = JobApplication.fromApiJson({
        'id': 2,
        'company': 'FactoryBench',
        'role': 'Mobile Engineer',
        'hasResume': true,
        'hasPortfolio': false,
        'hasCoverLetter': true,
        'hasApplicationQuestions': false,
        'hasOther': true,
        'isSaved': false,
      });

      expect(application.hasResume, isTrue);
      expect(application.hasPortfolio, isFalse);
      expect(application.hasCoverLetter, isTrue);
      expect(application.hasApplicationQuestions, isFalse);
      expect(application.hasOther, isTrue);
      expect(application.isSaved, isFalse);
    });
  });

  group('missing-booleans', () {
    test('defaults missing API boolean values to false', () {
      final application = JobApplication.fromApiJson({
        'id': 3,
        'company': 'FactoryBench',
        'role': 'Backend Engineer',
      });

      expect(application.hasResume, isFalse);
      expect(application.hasPortfolio, isFalse);
      expect(application.hasCoverLetter, isFalse);
      expect(application.hasApplicationQuestions, isFalse);
      expect(application.hasOther, isFalse);
      expect(application.isSaved, isFalse);
    });
  });

  group('non-boolean-fields', () {
    test('preserves existing API field values', () {
      final application = JobApplication.fromApiJson({
        'id': 42,
        'company': 'Acme',
        'role': 'Flutter Developer',
        'status': 'Offer',
        'dateApplied': '2026-10-30',
        'location': 'Virginia',
        'salaryRange': '\\$120k - \\$140k',
        'notes': 'FactoryBench verification',
      });

      expect(application.id, 42);
      expect(application.company, 'Acme');
      expect(application.role, 'Flutter Developer');
      expect(application.status, 'Offer');
      expect(application.dateApplied, '2026-10-30');
      expect(application.location, 'Virginia');
      expect(application.salaryRange, '\\$120k - \\$140k');
      expect(application.notes, 'FactoryBench verification');
    });

    test('preserves existing defaults for missing API fields', () {
      final application = JobApplication.fromApiJson({});

      expect(application.company, '');
      expect(application.role, '');
      expect(application.status, 'Applied');
      expect(application.dateApplied, 'No date added');
      expect(application.location, 'No location added');
      expect(application.salaryRange, 'No salary added');
      expect(application.notes, 'No notes added.');
    });
  });

  group('database-deserialization', () {
    test('continues to deserialize SQLite integer booleans', () {
      final application = JobApplication.fromDatabaseJson({
        'id': 4,
        'company': 'FactoryBench',
        'role': 'Reliability Engineer',
        'hasResume': 1,
        'hasPortfolio': 0,
        'hasCoverLetter': 1,
        'hasApplicationQuestions': 0,
        'hasOther': 1,
        'isSaved': 0,
      });

      expect(application.hasResume, isTrue);
      expect(application.hasPortfolio, isFalse);
      expect(application.hasCoverLetter, isTrue);
      expect(application.hasApplicationQuestions, isFalse);
      expect(application.hasOther, isTrue);
      expect(application.isSaved, isFalse);
    });
  });
}
`,
};
