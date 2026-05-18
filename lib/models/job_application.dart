class JobApplication {
  final String company;
  final String role;
  final String status;
  final String dateApplied;
  final String location;
  final String salaryRange;
  final String notes;
  final bool hasResume;
  final bool hasPortfolio;
  final bool hasCoverLetter;
  final bool hasApplicationQuestions;
  final bool hasOther;
  final bool isSaved;

  const JobApplication({
    required this.company,
    required this.role,
    required this.status,
    required this.dateApplied,
    required this.location,
    required this.salaryRange,
    required this.notes,
    required this.hasResume,
    required this.hasPortfolio,
    required this.hasCoverLetter,
    required this.hasApplicationQuestions,
    required this.hasOther,
    required this.isSaved,
  });

  JobApplication copyWith({
    String? company,
    String? role,
    String? status,
    String? dateApplied,
    String? location,
    String? salaryRange,
    String? notes,
    bool? hasResume,
    bool? hasPortfolio,
    bool? hasCoverLetter,
    bool? hasApplicationQuestions,
    bool? hasOther,
    bool? isSaved,
  }) {
    return JobApplication(
      company: company ?? this.company,
      role: role ?? this.role,
      status: status ?? this.status,
      dateApplied: dateApplied ?? this.dateApplied,
      location: location ?? this.location,
      salaryRange: salaryRange ?? this.salaryRange,
      notes: notes ?? this.notes,
      hasResume: hasResume ?? this.hasResume,
      hasPortfolio: hasPortfolio ?? this.hasPortfolio,
      hasCoverLetter: hasCoverLetter ?? this.hasCoverLetter,
      hasApplicationQuestions:
      hasApplicationQuestions ?? this.hasApplicationQuestions,
      hasOther: hasOther ?? this.hasOther,
      isSaved: isSaved ?? this.isSaved,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'company': company,
      'role': role,
      'status': status,
      'dateApplied': dateApplied,
      'location': location,
      'salaryRange': salaryRange,
      'notes': notes,
      'hasResume': hasResume,
      'hasPortfolio': hasPortfolio,
      'hasCoverLetter': hasCoverLetter,
      'hasApplicationQuestions': hasApplicationQuestions,
      'hasOther': hasOther,
      'isSaved': isSaved,
    };
  }

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    return JobApplication(
      company: json['company'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? 'Applied',
      dateApplied: json['dateApplied'] ?? 'No date added',
      location: json['location'] ?? 'No location added',
      salaryRange: json['salaryRange'] ?? 'No salary added',
      notes: json['notes'] ?? 'No notes added.',
      hasResume: json['hasResume'] ?? false,
      hasPortfolio: json['hasPortfolio'] ?? false,
      hasCoverLetter: json['hasCoverLetter'] ?? false,
      hasApplicationQuestions: json['hasApplicationQuestions'] ?? false,
      hasOther: json['hasOther'] ?? false,
      isSaved: json['isSaved'] ?? false,
    );
  }

  int get checklistCompletedCount {
    int count = 0;

    if (hasResume) {
      count++;
    }
    if (hasPortfolio) {
      count++;
    }
    if (hasCoverLetter) {
      count++;
    }
    if (hasApplicationQuestions) {
      count++;
    }
    if (hasOther) {
      count++;
    }

    return count;
  }

  bool get isChecklistComplete {
    return checklistCompletedCount == 5;
  }
}