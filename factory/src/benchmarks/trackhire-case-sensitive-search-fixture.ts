import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

/**
 * Held-out Flutter behavioral checks for the case-sensitive search task.
 * Install only in an isolated candidate worktree after implementation.
 * This intentionally fails to compile against the unchanged baseline.
 */
export const trackHireCaseSensitiveSearchFixture: BenchmarkFixture = {
  path: "test/factory_case_sensitive_search_test.dart",
  content: `import 'package:flutter_test/flutter_test.dart';
import 'package:trackhire/models/job_application.dart';
import 'package:trackhire/providers/application_provider.dart';

JobApplication application(String company, String role, String location, {
  String status = 'Applied',
  bool hasResume = true,
}) => JobApplication(
  company: company,
  role: role,
  status: status,
  dateApplied: 'November 3, 2026',
  location: location,
  salaryRange: '\\$120k',
  notes: '',
  hasResume: hasResume,
  hasPortfolio: true,
  hasCoverLetter: true,
  hasApplicationQuestions: true,
  hasOther: true,
  isSaved: false,
);

void main() {
  test('default mode ignores letter casing across searchable fields', () {
    final provider = ApplicationProvider();
    provider.applications = [
      application('Acme', 'iOS Engineer', 'Virginia'),
      application('Other', 'Backend', 'Remote'),
    ];
    for (final query in ['acme', 'IOS', 'virginia']) {
      provider.setSearchQuery(query);
      expect(provider.filteredApplications.map((a) => a.company), ['Acme']);
    }
  });

  test('enabled mode matches exact casing for company role and location', () {
    final provider = ApplicationProvider();
    provider.applications = [
      application('Acme', 'iOS Engineer', 'Virginia'),
      application('Other', 'Backend', 'Remote'),
    ];
    provider.toggleCaseSensitiveSearch();
    for (final query in ['acme', 'IOS', 'virginia']) {
      provider.setSearchQuery(query);
      expect(provider.filteredApplications, isEmpty);
    }
    for (final query in ['Acme', 'iOS', 'Virginia']) {
      provider.setSearchQuery(query);
      expect(provider.filteredApplications.map((a) => a.company), ['Acme']);
    }
  });

  test('turning case sensitivity off restores insensitive matching', () {
    final provider = ApplicationProvider();
    provider.applications = [application('Acme', 'iOS Engineer', 'Virginia')];
    provider.setSearchQuery('acme');
    provider.toggleCaseSensitiveSearch();
    expect(provider.filteredApplications, isEmpty);
    provider.toggleCaseSensitiveSearch();
    expect(provider.filteredApplications, hasLength(1));
  });

  test('case sensitivity composes with status and checklist filters', () {
    final provider = ApplicationProvider();
    provider.applications = [
      application('Acme', 'iOS Engineer', 'Virginia',
        status: 'Interviewing', hasResume: false),
      application('Acme', 'iOS Engineer', 'Virginia',
        status: 'Applied', hasResume: false),
      application('Acme', 'iOS Engineer', 'Virginia',
        status: 'Interviewing', hasResume: true),
    ];
    provider.setStatusFilter('Interviewing');
    provider.setChecklistFilter('Needs Resume');
    provider.toggleCaseSensitiveSearch();
    provider.setSearchQuery('Acme');
    expect(provider.filteredApplications, hasLength(1));
    provider.setSearchQuery('acme');
    expect(provider.filteredApplications, isEmpty);
  });
}
`,
};
