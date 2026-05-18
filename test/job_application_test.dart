import 'package:flutter_test/flutter_test.dart';
import 'package:trackhire/models/job_application.dart';

void main() {
  test('JobApplication correctly counts completed materials', () {
    const application = JobApplication(
      company: 'Apple',
      role: 'iOS Developer',
      status: 'Applied',
      dateApplied: 'May 17, 2026',
      location: 'Cupertino, CA',
      salaryRange: '\$120k - \$160k',
      notes: 'Applied through LinkedIn.',
      hasResume: true,
      hasPortfolio: true,
      hasCoverLetter: false,
      hasApplicationQuestions: true,
      hasOther: false,
      isSaved: true,
    );

    expect(application.checklistCompletedCount, 3);
    expect(application.isChecklistComplete, false);
  });

  test('JobApplication converts boolean values for SQLite correctly', () {
    const application = JobApplication(
      company: 'Robinhood',
      role: 'Mobile Engineer',
      status: 'Interviewing',
      dateApplied: 'May 15, 2026',
      location: 'Remote',
      salaryRange: '\$130k - \$170k',
      notes: 'Need to follow up with recruiter.',
      hasResume: true,
      hasPortfolio: false,
      hasCoverLetter: true,
      hasApplicationQuestions: true,
      hasOther: false,
      isSaved: false,
    );

    final json = application.toDatabaseJson();

    expect(json['hasResume'], 1);
    expect(json['hasPortfolio'], 0);
    expect(json['hasCoverLetter'], 1);
    expect(json['hasApplicationQuestions'], 1);
    expect(json['hasOther'], 0);
    expect(json['isSaved'], 0);
  });
}
