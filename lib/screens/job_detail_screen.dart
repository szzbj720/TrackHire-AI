import 'package:flutter/material.dart';

import '../models/job_application.dart';
import '../widgets/detail_section.dart';
import '../widgets/materials_section.dart';
import 'add_edit_job_screen.dart';

class JobDetailResult {
  final JobApplication? updatedApplication;
  final bool shouldDelete;

  const JobDetailResult({
    this.updatedApplication,
    this.shouldDelete = false,
  });
}

class JobDetailScreen extends StatefulWidget {
  final JobApplication application;

  const JobDetailScreen({
    super.key,
    required this.application,
  });

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  late JobApplication currentApplication;

  @override
  void initState() {
    super.initState();
    currentApplication = widget.application;
  }

  Color getStatusColor(String status) {
    if (status == 'Applied') {
      return Colors.blue;
    } else if (status == 'Interviewing') {
      return Colors.orange;
    } else if (status == 'Offer') {
      return Colors.green;
    } else if (status == 'Rejected') {
      return Colors.red;
    } else {
      return Colors.grey;
    }
  }

  Future<void> editApplication() async {
    final updatedApplication = await Navigator.push<JobApplication>(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditJobScreen(
          existingApplication: currentApplication,
        ),
      ),
    );

    if (updatedApplication != null) {
      setState(() {
        currentApplication = updatedApplication;
      });

      if (!mounted) {
        return;
      }

      Navigator.pop(
        context,
        JobDetailResult(updatedApplication: updatedApplication),
      );
    }
  }

  void toggleSavedOnDetail() {
    setState(() {
      currentApplication = currentApplication.copyWith(
        isSaved: !currentApplication.isSaved,
      );
    });
  }

  Future<void> confirmDelete() async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete application?'),
          content: Text(
            'Are you sure you want to delete ${currentApplication.company}?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context, false);
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(context, true);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (shouldDelete == true) {
      if (!mounted) {
        return;
      }

      Navigator.pop(
        context,
        const JobDetailResult(shouldDelete: true),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor = getStatusColor(currentApplication.status);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          return;
        }

        Navigator.pop(
          context,
          JobDetailResult(updatedApplication: currentApplication),
        );
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Application Details'),
          centerTitle: true,
          actions: [
            IconButton(
              onPressed: toggleSavedOnDetail,
              icon: Icon(
                currentApplication.isSaved
                    ? Icons.favorite
                    : Icons.favorite_border,
                color: currentApplication.isSaved ? Colors.red : null,
              ),
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              currentApplication.company,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              currentApplication.role,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  currentApplication.status,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            DetailSection(
              title: 'Company',
              content: currentApplication.company,
              icon: Icons.business_outlined,
            ),
            const SizedBox(height: 12),
            DetailSection(
              title: 'Role',
              content: currentApplication.role,
              icon: Icons.badge_outlined,
            ),
            const SizedBox(height: 12),
            DetailSection(
              title: 'Date Applied',
              content: currentApplication.dateApplied,
              icon: Icons.calendar_today_outlined,
            ),
            const SizedBox(height: 12),
            DetailSection(
              title: 'Location',
              content: currentApplication.location,
              icon: Icons.location_on_outlined,
            ),
            const SizedBox(height: 12),
            DetailSection(
              title: 'Salary Range',
              content: currentApplication.salaryRange,
              icon: Icons.attach_money,
            ),
            const SizedBox(height: 12),
            MaterialsSection(application: currentApplication),
            const SizedBox(height: 12),
            DetailSection(
              title: 'Notes',
              content: currentApplication.notes,
              icon: Icons.notes_outlined,
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: editApplication,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Edit Application'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: confirmDelete,
              icon: const Icon(Icons.delete_outline),
              label: const Text('Delete Application'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
              ),
            ),
          ],
        ),
      ),
    );
  }
}