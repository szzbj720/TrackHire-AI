import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireCsvMaterialsReadyFixture: BenchmarkFixture = {
  path: "test/factory_benchmark_csv_materials_ready_test.dart",
  content: `import 'package:flutter_test/flutter_test.dart';

import 'package:trackhire/models/job_application.dart';

JobApplication createApplication({
  bool hasResume = false,
  bool hasPortfolio = false,
  bool hasCoverLetter = false,
  bool hasApplicationQuestions = false,
  bool hasOther = false,
}) {
  return JobApplication(
    company: 'FactoryBench',
    role: 'Software Engineer',
    status: 'Applied',
    dateApplied: 'October 29, 2026',
    location: 'Remote',
    salaryRange: '\\$100k - \\$120k',
    notes: 'Benchmark fixture',
    hasResume: hasResume,
    hasPortfolio: hasPortfolio,
    hasCoverLetter: hasCoverLetter,
    hasApplicationQuestions: hasApplicationQuestions,
    hasOther: hasOther,
    isSaved: false,
  );
}

void main() {
  group('materials-count', () {
    test('reports zero completed materials', () {
      final application = createApplication();

      expect(application.checklistCompletedCount, 0);
    });

    test('reports partially completed materials', () {
      final application = createApplication(
        hasResume: true,
        hasPortfolio: true,
        hasApplicationQuestions: true,
      );

      expect(application.checklistCompletedCount, 3);
    });

    test('reports all completed materials', () {
      final application = createApplication(
        hasResume: true,
        hasPortfolio: true,
        hasCoverLetter: true,
        hasApplicationQuestions: true,
        hasOther: true,
      );

      expect(application.checklistCompletedCount, 5);
    });
  });
}
`,
};