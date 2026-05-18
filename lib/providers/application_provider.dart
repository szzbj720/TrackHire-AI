import 'package:flutter/material.dart';

import '../database/job_database.dart';
import '../models/job_application.dart';

class ApplicationProvider extends ChangeNotifier {
  List<JobApplication> applications = [];
  bool isLoading = true;

  int selectedPageIndex = 0;

  String searchQuery = '';
  String selectedFilter = 'All';
  String selectedChecklistFilter = 'All Docs';

  final List<String> filters = [
    'All',
    'Applied',
    'Interviewing',
    'Offer',
    'Rejected',
  ];

  final List<String> checklistFilters = [
    'All Docs',
    'Complete',
    'Incomplete',
    'Needs Resume',
    'Needs Portfolio',
    'Needs Cover Letter',
    'Needs Questions',
    'Needs Other',
  ];

  ApplicationProvider() {
    loadApplications();
  }

  List<JobApplication> get savedApplications {
    return applications.where((application) => application.isSaved).toList();
  }

  List<JobApplication> get filteredApplications {
    List<JobApplication> sourceApplications =
    selectedPageIndex == 0 ? applications : savedApplications;

    return sourceApplications.where((application) {
      final String query = searchQuery.toLowerCase();

      final bool matchesSearch =
          application.company.toLowerCase().contains(query) ||
              application.role.toLowerCase().contains(query) ||
              application.location.toLowerCase().contains(query) ||
              application.salaryRange.toLowerCase().contains(query) ||
              application.notes.toLowerCase().contains(query);

      final bool matchesStatusFilter =
          selectedFilter == 'All' || application.status == selectedFilter;

      bool matchesChecklistFilter = true;

      if (selectedChecklistFilter == 'Complete') {
        matchesChecklistFilter = application.isChecklistComplete;
      } else if (selectedChecklistFilter == 'Incomplete') {
        matchesChecklistFilter = !application.isChecklistComplete;
      } else if (selectedChecklistFilter == 'Needs Resume') {
        matchesChecklistFilter = !application.hasResume;
      } else if (selectedChecklistFilter == 'Needs Portfolio') {
        matchesChecklistFilter = !application.hasPortfolio;
      } else if (selectedChecklistFilter == 'Needs Cover Letter') {
        matchesChecklistFilter = !application.hasCoverLetter;
      } else if (selectedChecklistFilter == 'Needs Questions') {
        matchesChecklistFilter = !application.hasApplicationQuestions;
      } else if (selectedChecklistFilter == 'Needs Other') {
        matchesChecklistFilter = !application.hasOther;
      }

      return matchesSearch && matchesStatusFilter && matchesChecklistFilter;
    }).toList();
  }

  int get totalApplications {
    return applications.length;
  }

  int get savedCount {
    return savedApplications.length;
  }

  int get interviewingCount {
    return applications
        .where((application) => application.status == 'Interviewing')
        .length;
  }

  int get offerCount {
    return applications
        .where((application) => application.status == 'Offer')
        .length;
  }

  int get rejectedCount {
    return applications
        .where((application) => application.status == 'Rejected')
        .length;
  }

  Future<void> loadApplications() async {
    isLoading = true;
    notifyListeners();

    applications = await JobDatabase.instance.readAllApplications();

    if (applications.isEmpty) {
      await seedSampleApplications();
      applications = await JobDatabase.instance.readAllApplications();
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> seedSampleApplications() async {
    final List<JobApplication> sampleApplications = [
      const JobApplication(
        company: 'Apple',
        role: 'iOS Developer',
        status: 'Applied',
        dateApplied: 'May 17, 2026',
        location: 'Cupertino, CA',
        salaryRange: '\$120k - \$160k',
        notes: 'Applied through LinkedIn.',
        hasResume: true,
        hasPortfolio: true,
        hasCoverLetter: false,
        hasApplicationQuestions: true,
        hasOther: false,
        isSaved: true,
      ),
      const JobApplication(
        company: 'Robinhood',
        role: 'Mobile Engineer',
        status: 'Interviewing',
        dateApplied: 'May 15, 2026',
        location: 'Remote',
        salaryRange: '\$130k - \$170k',
        notes: 'Need to follow up with recruiter.',
        hasResume: true,
        hasPortfolio: true,
        hasCoverLetter: true,
        hasApplicationQuestions: true,
        hasOther: false,
        isSaved: false,
      ),
      const JobApplication(
        company: 'Duolingo',
        role: 'Software Engineer',
        status: 'Rejected',
        dateApplied: 'May 10, 2026',
        location: 'Pittsburgh, PA',
        salaryRange: 'Not listed',
        notes: 'Keep improving mobile portfolio.',
        hasResume: true,
        hasPortfolio: false,
        hasCoverLetter: false,
        hasApplicationQuestions: true,
        hasOther: false,
        isSaved: false,
      ),
    ];

    for (JobApplication application in sampleApplications) {
      await JobDatabase.instance.create(application);
    }
  }

  Future<void> addApplication(JobApplication newApplication) async {
    final int newId = await JobDatabase.instance.create(newApplication);

    applications.insert(
      0,
      newApplication.copyWith(id: newId),
    );

    notifyListeners();
  }

  Future<void> updateApplication(
      int index,
      JobApplication updatedApplication,
      ) async {
    if (index < 0 || index >= applications.length) {
      return;
    }

    final int? id = applications[index].id;

    if (id == null) {
      return;
    }

    final JobApplication applicationWithId = updatedApplication.copyWith(id: id);

    await JobDatabase.instance.update(id, applicationWithId);

    applications[index] = applicationWithId;

    notifyListeners();
  }

  Future<void> deleteApplication(int index) async {
    if (index < 0 || index >= applications.length) {
      return;
    }

    final int? id = applications[index].id;

    if (id == null) {
      return;
    }

    await JobDatabase.instance.delete(id);

    applications.removeAt(index);

    notifyListeners();
  }

  Future<void> toggleSaved(JobApplication selectedApplication) async {
    final int originalIndex = applications.indexOf(selectedApplication);

    if (originalIndex == -1) {
      return;
    }

    final JobApplication updatedApplication = selectedApplication.copyWith(
      isSaved: !selectedApplication.isSaved,
    );

    await updateApplication(originalIndex, updatedApplication);
  }

  void setSearchQuery(String value) {
    searchQuery = value;
    notifyListeners();
  }

  void clearSearchQuery() {
    searchQuery = '';
    notifyListeners();
  }

  void setStatusFilter(String value) {
    selectedFilter = value;
    notifyListeners();
  }

  void setChecklistFilter(String value) {
    selectedChecklistFilter = value;
    notifyListeners();
  }

  void clearSearchAndFilters() {
    searchQuery = '';
    selectedFilter = 'All';
    selectedChecklistFilter = 'All Docs';
    notifyListeners();
  }

  void changePage(int index) {
    selectedPageIndex = index;
    searchQuery = '';
    selectedFilter = 'All';
    selectedChecklistFilter = 'All Docs';
    notifyListeners();
  }
}