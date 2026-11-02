import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireSearchWhitespaceFixture: BenchmarkFixture = {
  path: "test/factory_benchmark_search_whitespace_test.dart",
  content: `import 'package:flutter_test/flutter_test.dart';

import 'package:trackhire/models/job_application.dart';
import 'package:trackhire/providers/application_provider.dart';

JobApplication buildApplication({
  required String company,
  required String role,
  String status = 'Applied',
  String location = 'Remote',
  String salaryRange = '\\$100k',
  String notes = 'Mobile engineering',
  bool hasResume = true,
  bool hasPortfolio = true,
  bool hasCoverLetter = true,
  bool hasApplicationQuestions = true,
  bool hasOther = true,
}) {
  return JobApplication(
    company: company,
    role: role,
    status: status,
    dateApplied: 'October 30, 2026',
    location: location,
    salaryRange: salaryRange,
    notes: notes,
    hasResume: hasResume,
    hasPortfolio: hasPortfolio,
    hasCoverLetter: hasCoverLetter,
    hasApplicationQuestions: hasApplicationQuestions,
    hasOther: hasOther,
    isSaved: false,
  );
}

void main() {
  group('trim-search-whitespace', () {
    test(
      'ignores leading and trailing search whitespace',
      () {
        final provider = ApplicationProvider();

        provider.applications = [
          buildApplication(
            company: 'Acme',
            role: 'Flutter Developer',
          ),
          buildApplication(
            company: 'Other Company',
            role: 'Backend Engineer',
          ),
        ];

        provider.setSearchQuery(
          '   flutter   ',
        );

        expect(
          provider.filteredApplications
              .map(
                (application) =>
                    application.role,
              )
              .toList(),
          ['Flutter Developer'],
        );
      },
    );
  });

  group('case-insensitive-search', () {
    test(
      'preserves case-insensitive search',
      () {
        final provider = ApplicationProvider();

        provider.applications = [
          buildApplication(
            company: 'Acme',
            role: 'Flutter Developer',
          ),
          buildApplication(
            company: 'Other Company',
            role: 'Backend Engineer',
          ),
        ];

        provider.setSearchQuery(
          'fLuTtEr',
        );

        expect(
          provider.filteredApplications
              .map(
                (application) =>
                    application.role,
              )
              .toList(),
          ['Flutter Developer'],
        );
      },
    );
  });

  group('searchable-fields', () {
    test(
      'searches all existing searchable fields',
      () {
        final provider = ApplicationProvider();

        final application =
            buildApplication(
          company: 'FactoryBench Labs',
          role: 'Mobile Engineer',
          location: 'Virginia',
          salaryRange: '\\$120k - \\$140k',
          notes: 'Works on reliability systems',
        );

        provider.applications = [
          application,
        ];

        final queries = [
          'factorybench',
          'mobile',
          'virginia',
          '120k',
          'reliability',
        ];

        for (final query in queries) {
          provider.setSearchQuery(query);

          expect(
            provider.filteredApplications,
            [application],
            reason:
                'Expected search query "$query" to match.',
          );
        }
      },
    );
  });

  group('combined-filters', () {
    test(
      'combines normalized search with status and materials filters',
      () {
        final provider = ApplicationProvider();

        final expected =
            buildApplication(
          company: 'Acme',
          role: 'Flutter Engineer',
          status: 'Interviewing',
          hasResume: false,
        );

        provider.applications = [
          expected,
          buildApplication(
            company: 'Acme',
            role: 'Flutter Engineer',
            status: 'Applied',
            hasResume: false,
          ),
          buildApplication(
            company: 'Acme',
            role: 'Flutter Engineer',
            status: 'Interviewing',
            hasResume: true,
          ),
          buildApplication(
            company: 'Other',
            role: 'Backend Engineer',
            status: 'Interviewing',
            hasResume: false,
          ),
        ];

        provider.setSearchQuery(
          '   flutter   ',
        );

        provider.setStatusFilter(
          'Interviewing',
        );

        provider.setChecklistFilter(
          'Needs Resume',
        );

        expect(
          provider.filteredApplications,
          [expected],
        );
      },
    );
  });

  group('clear-search', () {
    test(
      'clearing search restores applications',
      () {
        final provider = ApplicationProvider();

        provider.applications = [
          buildApplication(
            company: 'Acme',
            role: 'Flutter Developer',
          ),
          buildApplication(
            company: 'Other Company',
            role: 'Backend Engineer',
          ),
        ];

        provider.setSearchQuery(
          'flutter',
        );

        expect(
          provider.filteredApplications,
          hasLength(1),
        );

        provider.clearSearchQuery();

        expect(
          provider.searchQuery,
          isEmpty,
        );

        expect(
          provider.filteredApplications,
          hasLength(2),
        );
      },
    );
  });
}
`,
};
