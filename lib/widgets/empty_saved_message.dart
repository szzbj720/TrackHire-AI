import 'package:flutter/material.dart';

class EmptySavedMessage extends StatelessWidget {
  const EmptySavedMessage({super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(
              Icons.favorite_border,
              size: 48,
            ),
            const SizedBox(height: 12),
            Text(
              'No saved applications yet',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap the heart on an application to save it here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}