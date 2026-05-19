import 'package:flutter/material.dart';
import '../models/ai_job_analysis.dart';

class AIResultCard extends StatelessWidget {
  final AIJobAnalysis analysis;

  const AIResultCard({
    super.key,
    required this.analysis,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(top: 20),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'AI Job Analysis',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 16),

            _infoRow('Role', analysis.role),
            _infoRow('Company', analysis.company),
            _infoRow('Location', analysis.location),
            _infoRow('Salary', analysis.salaryRange),

            const SizedBox(height: 16),

            _sectionTitle('Required Skills'),
            _chipList(analysis.requiredSkills),

            const SizedBox(height: 16),

            _sectionTitle('Recommended Materials'),
            _chipList(analysis.recommendedMaterials),

            const SizedBox(height: 16),

            _sectionTitle('Interview Questions'),
            ...analysis.interviewQuestions.map(
                  (question) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text('• $question'),
              ),
            ),

            const SizedBox(height: 16),

            _sectionTitle('Summary'),
            Text(
              analysis.summary,
              style: const TextStyle(height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        '$label: $value',
        style: const TextStyle(fontSize: 15),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _chipList(List<String> items) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items.map((item) {
        return Chip(label: Text(item));
      }).toList(),
    );
  }
}