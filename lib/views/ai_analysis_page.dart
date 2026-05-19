import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/job_application.dart';
import '../providers/application_provider.dart';
import '../viewmodels/ai_view_model.dart';
import '../widgets/ai_result_card.dart';

class AIAnalysisPage extends StatefulWidget {
  const AIAnalysisPage({super.key});

  @override
  State<AIAnalysisPage> createState() => _AIAnalysisPageState();
}

class _AIAnalysisPageState extends State<AIAnalysisPage> {
  final TextEditingController _jobDescriptionController =
      TextEditingController();

  final AIViewModel _viewModel = AIViewModel();

  @override
  void dispose() {
    _jobDescriptionController.dispose();
    _viewModel.dispose();
    super.dispose();
  }

  void _analyzeJob() {
    _viewModel.analyzeJobDescription(_jobDescriptionController.text);
  }

  Future<void> _saveAnalysisToTrackHire() async {
    final analysis = _viewModel.analysis;

    if (analysis == null) {
      return;
    }

    final provider = context.read<ApplicationProvider>();

    final String notes =
        '''
AI Summary:
${analysis.summary}

Required Skills:
${analysis.requiredSkills.join(', ')}

Preferred Skills:
${analysis.preferredSkills.join(', ')}

Interview Questions:
${analysis.interviewQuestions.map((question) => '- $question').join('\n')}
''';

    final JobApplication newApplication = JobApplication(
      company: analysis.company,
      role: analysis.role,
      status: 'Applied',
      dateApplied:
          '${DateTime.now().month}/${DateTime.now().day}/${DateTime.now().year}',
      location: analysis.location,
      salaryRange: analysis.salaryRange,
      notes: notes,
      hasResume: analysis.recommendedMaterials.contains('Resume'),
      hasPortfolio:
          analysis.recommendedMaterials.contains('Portfolio') ||
          analysis.recommendedMaterials.contains('UI Project Examples') ||
          analysis.recommendedMaterials.contains('Salesforce Project Examples'),
      hasCoverLetter: analysis.recommendedMaterials.contains('Cover Letter'),
      hasApplicationQuestions: false,
      hasOther:
          analysis.recommendedMaterials.contains('GitHub') ||
          analysis.recommendedMaterials.contains('Project Examples'),
      isSaved: false,
    );

    await provider.addApplication(newApplication);

    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${analysis.role} saved to TrackHire.'),
        behavior: SnackBarBehavior.floating,
      ),
    );

    _jobDescriptionController.clear();
    _viewModel.clearAnalysis();
  }

  void _clearAnalysis() {
    _jobDescriptionController.clear();
    _viewModel.clearAnalysis();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _viewModel,
      builder: (context, child) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AI Job Analyzer',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Paste a job description below, and TrackHire AI will analyze the role, skills, materials, and interview prep for you.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),

              TextField(
                controller: _jobDescriptionController,
                maxLines: 10,
                decoration: InputDecoration(
                  labelText: 'Job Description',
                  hintText: 'Paste job description here...',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _viewModel.isLoading ? null : _analyzeJob,
                      icon: const Icon(Icons.auto_awesome),
                      label: Text(
                        _viewModel.isLoading
                            ? 'Analyzing...'
                            : 'Analyze with AI',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (_viewModel.analysis != null ||
                      _jobDescriptionController.text.isNotEmpty)
                    OutlinedButton.icon(
                      onPressed: _clearAnalysis,
                      icon: const Icon(Icons.clear),
                      label: const Text('Clear'),
                    ),
                ],
              ),

              if (_viewModel.isLoading)
                const Padding(
                  padding: EdgeInsets.only(top: 20),
                  child: Center(child: CircularProgressIndicator()),
                ),

              if (_viewModel.errorMessage.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    _viewModel.errorMessage,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),

              if (_viewModel.analysis != null) ...[
                AIResultCard(analysis: _viewModel.analysis!),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _saveAnalysisToTrackHire,
                    icon: const Icon(Icons.save_alt),
                    label: const Text('Save to TrackHire'),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
