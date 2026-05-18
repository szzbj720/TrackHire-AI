import 'package:flutter/material.dart';

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const StatCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
  });

  Color getBackgroundColor(String title) {
    if (title == 'Total') {
      return const Color(0xFFEDEAFF);
    } else if (title == 'Saved') {
      return const Color(0xFFFFEAF2);
    } else if (title == 'Offers') {
      return const Color(0xFFE9F8EF);
    } else if (title == 'Interviewing') {
      return const Color(0xFFFFF3D9);
    } else if (title == 'Rejected') {
      return const Color(0xFFFFE8E8);
    } else {
      return const Color(0xFFF5F2FF);
    }
  }

  Color getIconColor(String title) {
    if (title == 'Total') {
      return const Color(0xFF6C63FF);
    } else if (title == 'Saved') {
      return const Color(0xFFE84A7A);
    } else if (title == 'Offers') {
      return const Color(0xFF2E9D5B);
    } else if (title == 'Interviewing') {
      return const Color(0xFFE29A16);
    } else if (title == 'Rejected') {
      return const Color(0xFFE05252);
    } else {
      return const Color(0xFF6C63FF);
    }
  }

  @override
  Widget build(BuildContext context) {
    Color backgroundColor = getBackgroundColor(title);
    Color iconColor = getIconColor(title);

    return Card(
      elevation: 0,
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 12,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.78),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                size: 21,
                color: iconColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: const Color(0xFF25223A),
                fontWeight: FontWeight.bold,
                fontSize: 24,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFF6B6680),
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}