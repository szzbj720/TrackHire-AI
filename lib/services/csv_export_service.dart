import 'dart:io';

import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../models/job_application.dart';

class CsvExportService {
  static Future<void> exportApplications({
    required BuildContext context,
    required List<JobApplication> applications,
  }) async {
    if (applications.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No applications to export.')),
      );
      return;
    }

    try {
      final List<List<dynamic>> rows = [
        [
          'Company',
          'Role',
          'Status',
          'Date Applied',
          'Location',
          'Salary Range',
          'Notes',
          'Resume',
          'Portfolio',
          'Cover Letter',
          'Application Questions',
          'Other Materials',
          'Saved',
        ],
      ];

      for (JobApplication application in applications) {
        rows.add([
          application.company,
          application.role,
          application.status,
          application.dateApplied,
          application.location,
          application.salaryRange,
          application.notes,
          application.hasResume ? 'Yes' : 'No',
          application.hasPortfolio ? 'Yes' : 'No',
          application.hasCoverLetter ? 'Yes' : 'No',
          application.hasApplicationQuestions ? 'Yes' : 'No',
          application.hasOther ? 'Yes' : 'No',
          application.isSaved ? 'Yes' : 'No',
        ]);
      }

      final String csvData = const CsvEncoder().convert(rows);

      final Directory directory = await getApplicationDocumentsDirectory();

      final DateTime now = DateTime.now();

      final String timestamp =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      final File file = File(
        '${directory.path}/trackhire_applications_$timestamp.csv',
      );

      await file.writeAsString(csvData);

      if (!context.mounted) {
        return;
      }

      final RenderBox? box = context.findRenderObject() as RenderBox?;

      await SharePlus.instance.share(
        ShareParams(
          title: 'TrackHire Applications Export',
          subject: 'TrackHire Applications Export',
          text: 'Here is my exported TrackHire job application data.',
          files: [
            XFile(
              file.path,
              mimeType: 'text/csv',
              name: 'trackhire_applications.csv',
            ),
          ],
          sharePositionOrigin: box == null
              ? null
              : box.localToGlobal(Offset.zero) & box.size,
        ),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Export failed: $error')));
    }
  }
}
