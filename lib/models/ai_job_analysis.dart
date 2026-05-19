class AIJobAnalysis {
  final String company;
  final String role;
  final String location;
  final String salaryRange;
  final List<String> requiredSkills;
  final List<String> preferredSkills;
  final List<String> recommendedMaterials;
  final List<String> interviewQuestions;
  final String summary;

  AIJobAnalysis({
    required this.company,
    required this.role,
    required this.location,
    required this.salaryRange,
    required this.requiredSkills,
    required this.preferredSkills,
    required this.recommendedMaterials,
    required this.interviewQuestions,
    required this.summary,
  });

  factory AIJobAnalysis.empty() {
    return AIJobAnalysis(
      company: '',
      role: '',
      location: '',
      salaryRange: '',
      requiredSkills: [],
      preferredSkills: [],
      recommendedMaterials: [],
      interviewQuestions: [],
      summary: '',
    );
  }
}
