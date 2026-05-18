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
      return const Color(0xFF5B7CFA);
    } else if (status == 'Interviewing') {
      return const Color(0xFFE29A16);
    } else if (status == 'Offer') {
      return const Color(0xFF2E9D5B);
    } else if (status == 'Rejected') {
      return const Color(0xFFE05252);
    } else {
      return const Color(0xFF8D87A1);
    }
  }

  Color getStatusBackgroundColor(String status) {
    if (status == 'Applied') {
      return const Color(0xFFEAF0FF);
    } else if (status == 'Interviewing') {
      return const Color(0xFFFFF3D9);
    } else if (status == 'Offer') {
      return const Color(0xFFE9F8EF);
    } else if (status == 'Rejected') {
      return const Color(0xFFFFE8E8);
    } else {
      return const Color(0xFFF2F0F8);
    }
  }

  @override
  Widget build(BuildContext context) {
    Color statusColor = getStatusColor(application.status);
    Color statusBackgroundColor = getStatusBackgroundColor(application.status);
    double checklistProgress = application.checklistCompletedCount / 5;

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(26),
        side: const BorderSide(color: Color(0xFFF0EAF8)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(26),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDEAFF),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.business_center_outlined,
                      color: Color(0xFF6C63FF),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          application.company,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: const Color(0xFF25223A),
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          application.role,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: const Color(0xFF6B6680),
                                fontWeight: FontWeight.w500,
                              ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onSavedTap,
                    icon: Icon(
                      application.isSaved
                          ? Icons.favorite
                          : Icons.favorite_border,
                      color: application.isSaved
                          ? const Color(0xFFE84A7A)
                          : const Color(0xFF9B95AD),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 18,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      application.location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.attach_money,
                    size: 18,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      application.salaryRange,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: statusBackgroundColor,
                      borderRadius: BorderRadius.circular(18),
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
                  const Spacer(),
                  Text(
                    'Applied: ${application.dateApplied}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Materials Ready',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${application.checklistCompletedCount}/5',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF6C63FF),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: checklistProgress,
                  minHeight: 7,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
