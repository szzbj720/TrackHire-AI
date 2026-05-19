import '../models/ai_job_analysis.dart';

class AIService {
  Future<AIJobAnalysis> analyzeJobDescription(String jobDescription) async {
    await Future.delayed(const Duration(seconds: 2));

    final String lowerText = jobDescription.toLowerCase();

    final String role = _extractRole(jobDescription, lowerText);
    final String company = _extractCompany(jobDescription);
    final String location = _extractLocation(jobDescription, lowerText);
    final String salaryRange = _extractSalary(jobDescription, lowerText);
    final List<String> requiredSkills = _extractRequiredSkills(lowerText);
    final List<String> preferredSkills = _extractPreferredSkills(lowerText);
    final List<String> recommendedMaterials = _recommendMaterials(lowerText);

    return AIJobAnalysis(
      company: company,
      role: role,
      location: location,
      salaryRange: salaryRange,
      requiredSkills: requiredSkills,
      preferredSkills: preferredSkills,
      recommendedMaterials: recommendedMaterials,
      interviewQuestions: _generateInterviewQuestions(role, requiredSkills),
      summary: _generateSummary(role, location, salaryRange, requiredSkills),
    );
  }

  String _extractRole(String originalText, String lowerText) {
    final List<String> lines = originalText
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    for (String line in lines.take(5)) {
      final String lowerLine = line.toLowerCase();

      if (lowerLine.contains('developer') ||
          lowerLine.contains('engineer') ||
          lowerLine.contains('analyst') ||
          lowerLine.contains('designer') ||
          lowerLine.contains('manager')) {
        return line;
      }
    }

    if (lowerText.contains('salesforce') && lowerText.contains('ui')) {
      return 'Salesforce UI Developer';
    }

    if (lowerText.contains('lightning web components') ||
        lowerText.contains('lwc')) {
      return 'Salesforce UI Developer';
    }

    if (lowerText.contains('frontend') || lowerText.contains('front-end')) {
      return 'Frontend Developer';
    }

    if (lowerText.contains('ios developer') ||
        lowerText.contains('swift developer')) {
      return 'iOS Developer';
    }

    if (lowerText.contains('flutter') || lowerText.contains('dart')) {
      return 'Flutter Developer';
    }

    if (lowerText.contains('backend') || lowerText.contains('back-end')) {
      return 'Backend Developer';
    }

    return 'Software Engineer';
  }

  String _extractCompany(String originalText) {
    final List<String> lines = originalText
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    for (String line in lines) {
      final String lowerLine = line.toLowerCase();

      if (lowerLine.startsWith('company:')) {
        return line.split(':').last.trim();
      }

      if (lowerLine.startsWith('our client')) {
        return 'Client Company';
      }
    }

    return 'Unknown Company';
  }

  String _extractLocation(String originalText, String lowerText) {
    final List<String> lines = originalText
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    for (String line in lines) {
      final String lowerLine = line.toLowerCase();

      if (lowerLine.startsWith('location:')) {
        return line
            .replaceFirst(RegExp(r'Location:', caseSensitive: false), '')
            .trim();
      }

      if (lowerLine.startsWith('work location:')) {
        return line
            .replaceFirst(RegExp(r'Work Location:', caseSensitive: false), '')
            .trim();
      }
    }

    if (lowerText.contains('tysons')) {
      return 'Tysons, VA';
    }

    if (lowerText.contains('on-site') || lowerText.contains('onsite')) {
      return 'On-site';
    }

    if (lowerText.contains('remote')) {
      return 'Remote';
    }

    if (lowerText.contains('hybrid')) {
      return 'Hybrid';
    }

    return 'Not specified';
  }

  String _extractSalary(String originalText, String lowerText) {
    final List<String> lines = originalText
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();

    for (String line in lines) {
      final String lowerLine = line.toLowerCase();

      if (lowerLine.startsWith('pay:')) {
        return line
            .replaceFirst(RegExp(r'Pay:', caseSensitive: false), '')
            .trim();
      }

      if (lowerLine.contains('per hour') || lowerLine.contains('/hour')) {
        return line.trim();
      }

      if (lowerLine.contains('salary')) {
        return line.trim();
      }
    }

    if (lowerText.contains(r'$40.00') || lowerText.contains('40.00 per hour')) {
      return 'From \$40.00 per hour';
    }

    return 'Not specified';
  }

  List<String> _extractRequiredSkills(String lowerText) {
    final List<String> skills = [];

    void addSkill(String keyword, String skill) {
      if (lowerText.contains(keyword) && !skills.contains(skill)) {
        skills.add(skill);
      }
    }

    addSkill('salesforce', 'Salesforce');
    addSkill('lightning web components', 'Lightning Web Components');
    addSkill('lwc', 'LWC');
    addSkill('apex', 'Apex');
    addSkill('salesforce flows', 'Salesforce Flows');
    addSkill('declarative tools', 'Declarative Tools');
    addSkill('figma', 'Figma');
    addSkill('ui/ux', 'UI/UX');
    addSkill('responsive', 'Responsive Design');
    addSkill('mobile', 'Mobile UI');
    addSkill('desktop', 'Desktop UI');
    addSkill('rest', 'REST APIs');
    addSkill('soap', 'SOAP APIs');
    addSkill('oauth', 'OAuth');
    addSkill('ci/cd', 'CI/CD');
    addSkill('git', 'Git');
    addSkill('agile', 'Agile/Scrum');
    addSkill('scrum', 'Agile/Scrum');
    addSkill('aem', 'Adobe Experience Manager');
    addSkill('financial services cloud', 'Salesforce FSC');

    if (skills.isEmpty) {
      skills.addAll([
        'Software Development',
        'Problem Solving',
        'Communication',
      ]);
    }

    return skills;
  }

  List<String> _extractPreferredSkills(String lowerText) {
    final List<String> skills = [];

    void addSkill(String keyword, String skill) {
      if (lowerText.contains(keyword) && !skills.contains(skill)) {
        skills.add(skill);
      }
    }

    addSkill('financial services', 'Financial Services');
    addSkill('banking', 'Banking Domain Knowledge');
    addSkill('high-volume', 'Enterprise Applications');
    addSkill('external systems', 'External System Integration');
    addSkill('offshore', 'Offshore Team Collaboration');
    addSkill('uat', 'UAT Testing');
    addSkill('release cycles', 'Release Support');

    if (skills.isEmpty) {
      skills.addAll([
        'Team Collaboration',
        'Clean Architecture',
        'Testing Experience',
      ]);
    }

    return skills;
  }

  List<String> _recommendMaterials(String lowerText) {
    final List<String> materials = ['Resume', 'Portfolio', 'Cover Letter'];

    if (lowerText.contains('ui') ||
        lowerText.contains('figma') ||
        lowerText.contains('design')) {
      materials.add('UI Project Examples');
    }

    if (lowerText.contains('salesforce')) {
      materials.add('Salesforce Project Examples');
    }

    if (lowerText.contains('github') ||
        lowerText.contains('git') ||
        lowerText.contains('ci/cd')) {
      materials.add('GitHub');
    }

    return materials;
  }

  List<String> _generateInterviewQuestions(
    String role,
    List<String> requiredSkills,
  ) {
    final List<String> questions = [
      'Tell me about yourself and your background related to $role.',
      'Describe a project where you translated design requirements into a working user interface.',
      'How do you make sure a UI is responsive, accessible, and consistent across devices?',
      'Tell me about a time you worked under a tight deadline.',
      'How do you collaborate with designers, backend engineers, and external teams?',
    ];

    if (requiredSkills.contains('Salesforce') ||
        requiredSkills.contains('Lightning Web Components') ||
        requiredSkills.contains('LWC')) {
      questions.add(
        'What experience do you have building Salesforce user interfaces with Lightning Web Components?',
      );
    }

    if (requiredSkills.contains('Figma')) {
      questions.add(
        'How do you turn Figma designs into pixel-accurate production UI?',
      );
    }

    if (requiredSkills.contains('CI/CD')) {
      questions.add(
        'What role have you played in release cycles, testing, or CI/CD workflows?',
      );
    }

    return questions;
  }

  String _generateSummary(
    String role,
    String location,
    String salaryRange,
    List<String> requiredSkills,
  ) {
    final String skillsText = requiredSkills.take(5).join(', ');

    return 'This role appears to be a $role position based in $location. '
        'The role emphasizes $skillsText. '
        'Strong preparation should include UI development examples, design-to-code experience, responsive interface work, and a clear explanation of how your background matches the required skills. '
        'Listed compensation: $salaryRange.';
  }
}
