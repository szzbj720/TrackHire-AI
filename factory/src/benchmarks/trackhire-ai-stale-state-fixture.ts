import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireAiStaleStateFixture: BenchmarkFixture = {
  path: "test/factory_benchmark_ai_stale_state_test.dart",
  content: `import 'package:flutter_test/flutter_test.dart';

import 'package:trackhire/viewmodels/ai_view_model.dart';

void main() {
  group('clear-stale-analysis', () {
    test('blank input clears a previous analysis', () async {
      final viewModel = AIViewModel();

      await viewModel.analyzeJobDescription(
        'Flutter mobile developer role',
      );

      expect(viewModel.analysis, isNotNull);

      await viewModel.analyzeJobDescription('   ');

      expect(viewModel.analysis, isNull);
    });
  });

  group('analysis-validation', () {
    test('blank input preserves the analysis validation message', () async {
      final viewModel = AIViewModel();

      await viewModel.analyzeJobDescription(
        'Flutter mobile developer role',
      );

      await viewModel.analyzeJobDescription('   ');

      expect(
        viewModel.errorMessage,
        'Please paste a job description first.',
      );
    });
  });

  group('clear-stale-resume', () {
    test('blank input clears previous tailored resume bullets', () async {
      final viewModel = AIViewModel();

      await viewModel.tailorResume(
        'Flutter developer using Dart',
      );

      expect(
        viewModel.tailoredResumeBullets,
        isNotEmpty,
      );

      await viewModel.tailorResume('   ');

      expect(
        viewModel.tailoredResumeBullets,
        isEmpty,
      );
    });
  });

  group('resume-validation', () {
    test('blank input preserves the resume validation message', () async {
      final viewModel = AIViewModel();

      await viewModel.tailorResume(
        'Flutter developer using Dart',
      );

      await viewModel.tailorResume('   ');

      expect(
        viewModel.resumeTailorError,
        'Please paste a job description first.',
      );
    });
  });

  group('successful-results', () {
    test('valid analysis input still produces an analysis', () async {
      final viewModel = AIViewModel();

      await viewModel.analyzeJobDescription(
        'Flutter mobile developer role',
      );

      expect(viewModel.analysis, isNotNull);
      expect(viewModel.errorMessage, isEmpty);
      expect(viewModel.isLoading, isFalse);
    });

    test('valid resume input still produces tailored bullets', () async {
      final viewModel = AIViewModel();

      await viewModel.tailorResume(
        'Flutter developer using Dart',
      );

      expect(
        viewModel.tailoredResumeBullets,
        isNotEmpty,
      );

      expect(
        viewModel.resumeTailorError,
        isEmpty,
      );

      expect(
        viewModel.isTailoringResume,
        isFalse,
      );
    });
  });

  group('clear-analysis', () {
    test('clearAnalysis resets generated results and errors', () async {
      final viewModel = AIViewModel();

      await viewModel.analyzeJobDescription(
        'Flutter mobile developer role',
      );

      await viewModel.tailorResume(
        'Flutter developer using Dart',
      );

      await viewModel.analyzeJobDescription('');

      await viewModel.tailorResume('');

      viewModel.clearAnalysis();

      expect(viewModel.analysis, isNull);
      expect(
        viewModel.tailoredResumeBullets,
        isEmpty,
      );

      expect(viewModel.errorMessage, isEmpty);
      expect(viewModel.resumeTailorError, isEmpty);
    });
  });
}
`,
};