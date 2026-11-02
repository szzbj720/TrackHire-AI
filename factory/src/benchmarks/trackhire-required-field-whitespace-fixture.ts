import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireRequiredFieldWhitespaceFixture: BenchmarkFixture = {
  path: "test/factory_benchmark_required_field_whitespace_test.dart",
  content: `import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:trackhire/models/job_application.dart';
import 'package:trackhire/screens/add_edit_job_screen.dart';

Future<void> scrollToSaveButton(
  WidgetTester tester,
) async {
  await tester.dragUntilVisible(
    find.text('Save Application'),
    find.byType(ListView),
    const Offset(0, -300),
  );

  await tester.pumpAndSettle();
}

void main() {
  group('reject-whitespace-company', () {
    testWidgets(
      'rejects a whitespace-only company',
      (tester) async {
        await tester.pumpWidget(
          const MaterialApp(
            home: AddEditJobScreen(),
          ),
        );

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Company',
          ),
          '   ',
        );

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Role',
          ),
          'Software Engineer',
        );

        await scrollToSaveButton(tester);

        await tester.tap(
          find.text('Save Application'),
        );

        await tester.pump();

        expect(
          find.text(
            'Please enter a company and role.',
          ),
          findsOneWidget,
        );
      },
    );
  });

  group('reject-whitespace-role', () {
    testWidgets(
      'rejects a whitespace-only role',
      (tester) async {
        await tester.pumpWidget(
          const MaterialApp(
            home: AddEditJobScreen(),
          ),
        );

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Company',
          ),
          'FactoryBench',
        );

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Role',
          ),
          '   ',
        );

        await scrollToSaveButton(tester);

        await tester.tap(
          find.text('Save Application'),
        );

        await tester.pump();

        expect(
          find.text(
            'Please enter a company and role.',
          ),
          findsOneWidget,
        );
      },
    );
  });

  group('validation-message', () {
    testWidgets(
      'preserves the existing validation message',
      (tester) async {
        await tester.pumpWidget(
          const MaterialApp(
            home: AddEditJobScreen(),
          ),
        );

        await scrollToSaveButton(tester);

        await tester.tap(
          find.text('Save Application'),
        );

        await tester.pump();

        expect(
          find.text(
            'Please enter a company and role.',
          ),
          findsOneWidget,
        );
      },
    );
  });

  group('valid-input', () {
    testWidgets(
      'accepts normal company and role values',
      (tester) async {
        JobApplication? result;

        await tester.pumpWidget(
          MaterialApp(
            home: Builder(
              builder: (context) {
                return Scaffold(
                  body: FilledButton(
                    onPressed: () async {
                      result =
                          await Navigator.push<JobApplication>(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              const AddEditJobScreen(),
                        ),
                      );
                    },
                    child: const Text('Open form'),
                  ),
                );
              },
            ),
          ),
        );

        await tester.tap(
          find.text('Open form'),
        );

        await tester.pumpAndSettle();

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Company',
          ),
          'FactoryBench',
        );

        await tester.enterText(
          find.widgetWithText(
            TextField,
            'Role',
          ),
          'Software Engineer',
        );

        await scrollToSaveButton(tester);

        await tester.tap(
          find.text('Save Application'),
        );

        await tester.pumpAndSettle();

        expect(result, isNotNull);

        expect(
          result?.company,
          'FactoryBench',
        );

        expect(
          result?.role,
          'Software Engineer',
        );
      },
    );
  });

  group('edit-behavior', () {
    testWidgets(
      'populates existing company and role values',
      (tester) async {
        final application =
            JobApplication(
          company: 'Existing Company',
          role: 'Existing Role',
          status: 'Interviewing',
          dateApplied: 'October 30, 2026',
          location: 'Remote',
          salaryRange: '\\$100k - \\$120k',
          notes: 'FactoryBench',
          hasResume: true,
          hasPortfolio: false,
          hasCoverLetter: false,
          hasApplicationQuestions: false,
          hasOther: false,
          isSaved: false,
        );

        await tester.pumpWidget(
          MaterialApp(
            home: AddEditJobScreen(
              existingApplication:
                  application,
            ),
          ),
        );

        final companyField =
            tester.widget<TextField>(
          find.widgetWithText(
            TextField,
            'Company',
          ),
        );

        final roleField =
            tester.widget<TextField>(
          find.widgetWithText(
            TextField,
            'Role',
          ),
        );

        expect(
          companyField.controller?.text,
          'Existing Company',
        );

        expect(
          roleField.controller?.text,
          'Existing Role',
        );
      },
    );
  });
}
`,
};
