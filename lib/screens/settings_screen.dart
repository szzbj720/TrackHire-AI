import 'package:flutter/material.dart';

import '../models/job_application.dart';
import '../services/csv_export_service.dart';

class SettingsScreen extends StatelessWidget {
  final int totalApplications;
  final int savedApplications;
  final List<JobApplication> applications;

  const SettingsScreen({
    super.key,
    required this.totalApplications,
    required this.savedApplications,
    required this.applications,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      children: [
        Text(
          'Settings',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Manage your TrackHire app preferences and data.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDEAFF),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.storage_outlined,
                        color: Color(0xFF6C63FF),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Data Overview',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SettingsInfoRow(
                  label: 'Total Applications',
                  value: totalApplications.toString(),
                ),
                const SizedBox(height: 10),
                SettingsInfoRow(
                  label: 'Saved Applications',
                  value: savedApplications.toString(),
                ),
                const SizedBox(height: 10),
                const SettingsInfoRow(label: 'Storage', value: 'SQLite'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Data Management',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                SettingsTile(
                  icon: Icons.file_download_outlined,
                  title: 'Export Applications',
                  subtitle: 'Export your job application data as a CSV file.',
                  onTap: () async {
                    await CsvExportService.exportApplications(
                      context: context,
                      applications: applications,
                    );
                  },
                ),
                const SizedBox(height: 8),
                SettingsTile(
                  icon: Icons.delete_outline,
                  title: 'Clear Applications',
                  subtitle: 'Coming later: remove all saved applications.',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Clear applications will be added later.',
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'About TrackHire',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'TrackHire helps job seekers organize applications, track required materials, save important opportunities, and monitor progress throughout the job search process.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                Text(
                  'Tech Stack',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF25223A),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    TechChip(label: 'Flutter'),
                    TechChip(label: 'Dart'),
                    TechChip(label: 'Provider'),
                    TechChip(label: 'SQLite'),
                    TechChip(label: 'Material 3'),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class SettingsInfoRow extends StatelessWidget {
  final String label;
  final String value;

  const SettingsInfoRow({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: const Color(0xFF25223A),
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const SettingsTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F2FF),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Icon(icon, color: const Color(0xFF6C63FF)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF25223A),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFFAAA3BC)),
          ],
        ),
      ),
    );
  }
}

class TechChip extends StatelessWidget {
  final String label;

  const TechChip({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      backgroundColor: const Color(0xFFEDEAFF),
      side: BorderSide.none,
      labelStyle: const TextStyle(
        color: Color(0xFF6C63FF),
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
