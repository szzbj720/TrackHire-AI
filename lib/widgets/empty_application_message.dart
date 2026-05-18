import 'package:flutter/material.dart';

class EmptyApplicationMessage extends StatelessWidget {
  const EmptyApplicationMessage({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(
              Icons.work_outline,
              size: 48,
            ),
            const SizedBox(height: 12),
            Text(
              'No applications yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap Add Job to start tracking your applications.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}