import 'package:flutter/material.dart';

import '../models/job_application.dart';

class MaterialsSection extends StatelessWidget {
  final JobApplication application;

  const MaterialsSection({
    super.key,
    required this.application,
  });

  @override
  Widget build(BuildContext context) {
    double checklistProgress = application.checklistCompletedCount / 5;

    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.checklist_outlined),
                const SizedBox(width: 12),
                Text(
                  'Application Materials',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text('${application.checklistCompletedCount}/5'),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: checklistProgress,
            ),
            const SizedBox(height: 12),
            ChecklistItem(
              title: 'Resume',
              isChecked: application.hasResume,
            ),
            ChecklistItem(
              title: 'Portfolio',
              isChecked: application.hasPortfolio,
            ),
            ChecklistItem(
              title: 'Cover Letter',
              isChecked: application.hasCoverLetter,
            ),
            ChecklistItem(
              title: 'Application Questions',
              isChecked: application.hasApplicationQuestions,
            ),
            ChecklistItem(
              title: 'Other',
              isChecked: application.hasOther,
            ),
          ],
        ),
      ),
    );
  }
}

class ChecklistItem extends StatelessWidget {
  final String title;
  final bool isChecked;

  const ChecklistItem({
    super.key,
    required this.title,
    required this.isChecked,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          Icon(
            isChecked ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 20,
            color: isChecked ? Colors.green : Colors.grey,
          ),
          const SizedBox(width: 8),
          Text(title),
        ],
      ),
    );
  }
}