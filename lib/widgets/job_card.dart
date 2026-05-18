import 'package:flutter/material.dart';

import '../models/job_application.dart';

class JobCard extends StatelessWidget {
  final JobApplication application;
  final VoidCallback onTap;
  final VoidCallback onSavedTap;

  const JobCard({
    super.key,
    required this.application,
    required this.onTap,
    required this.onSavedTap,
  });

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

  @override
  Widget build(BuildContext context) {
    Color statusColor = getStatusColor(application.status);
    double checklistProgress = application.checklistCompletedCount / 5;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          children: [
            Expanded(
              child: Text(
                application.company,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            IconButton(
              onPressed: onSavedTap,
              icon: Icon(
                application.isSaved ? Icons.favorite : Icons.favorite_border,
                color: application.isSaved ? Colors.red : null,
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(application.role),
              const SizedBox(height: 6),
              Text('Location: ${application.location}'),
              const SizedBox(height: 6),
              Text('Salary: ${application.salaryRange}'),
              const SizedBox(height: 6),
              Text('Materials Ready: ${application.checklistCompletedCount}/5'),
              const SizedBox(height: 6),
              LinearProgressIndicator(
                value: checklistProgress,
              ),
              const SizedBox(height: 6),
              Text('Applied: ${application.dateApplied}'),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    application.status,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}