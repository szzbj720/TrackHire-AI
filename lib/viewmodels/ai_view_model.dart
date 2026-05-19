import 'package:flutter/material.dart';
import '../models/ai_job_analysis.dart';
import '../services/ai_service.dart';

class AIViewModel extends ChangeNotifier {
  final AIService _aiService = AIService();

  bool _isLoading = false;
  String _errorMessage = '';
  AIJobAnalysis? _analysis;

  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  AIJobAnalysis? get analysis => _analysis;

  Future<void> analyzeJobDescription(String jobDescription) async {
    if (jobDescription.trim().isEmpty) {
      _errorMessage = 'Please paste a job description first.';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = '';
    _analysis = null;
    notifyListeners();

    try {
      _analysis = await _aiService.analyzeJobDescription(jobDescription);
    } catch (error) {
      _errorMessage = 'Something went wrong while analyzing the job description.';
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearAnalysis() {
    _analysis = null;
    _errorMessage = '';
    notifyListeners();
  }
}