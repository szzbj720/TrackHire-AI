import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/job_application.dart';
import '../widgets/empty_application_message.dart';
import '../widgets/empty_saved_message.dart';
import '../widgets/empty_search_message.dart';
import '../widgets/job_card.dart';
import '../widgets/stat_card.dart';
import 'add_edit_job_screen.dart';
import 'job_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const String storageKey = 'job_applications';

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

  @override
  void initState() {
    super.initState();
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

  Future<void> loadApplications() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? savedData = prefs.getString(storageKey);

    if (savedData == null) {
      setState(() {
        applications = [
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
        isLoading = false;
      });

      await saveApplications();
      return;
    }

    final List<dynamic> decodedData = jsonDecode(savedData);

    setState(() {
      applications =
          decodedData.map((item) => JobApplication.fromJson(item)).toList();
      isLoading = false;
    });
  }

  Future<void> saveApplications() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    final List<Map<String, dynamic>> encodedApplications =
    applications.map((application) => application.toJson()).toList();

    await prefs.setString(storageKey, jsonEncode(encodedApplications));
  }

  Future<void> addApplication(JobApplication newApplication) async {
    setState(() {
      applications.add(newApplication);
    });

    await saveApplications();
  }

  Future<void> updateApplication(
      int index,
      JobApplication updatedApplication,
      ) async {
    setState(() {
      applications[index] = updatedApplication;
    });

    await saveApplications();
  }

  Future<void> deleteApplication(int index) async {
    setState(() {
      applications.removeAt(index);
    });

    await saveApplications();
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

  Future<void> openAddJobScreen() async {
    final newApplication = await Navigator.push<JobApplication>(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditJobScreen(),
      ),
    );

    if (newApplication != null) {
      await addApplication(newApplication);
    }
  }

  Future<void> openDetailScreen(JobApplication selectedApplication) async {
    final int originalIndex = applications.indexOf(selectedApplication);

    if (originalIndex == -1) {
      return;
    }

    final result = await Navigator.push<JobDetailResult>(
      context,
      MaterialPageRoute(
        builder: (context) => JobDetailScreen(
          application: selectedApplication,
        ),
      ),
    );

    if (result == null) {
      return;
    }

    if (result.shouldDelete) {
      await deleteApplication(originalIndex);
      return;
    }

    if (result.updatedApplication != null) {
      await updateApplication(originalIndex, result.updatedApplication!);
    }
  }

  void clearSearchAndFilters() {
    setState(() {
      searchQuery = '';
      selectedFilter = 'All';
      selectedChecklistFilter = 'All Docs';
    });
  }

  void changePage(int index) {
    setState(() {
      selectedPageIndex = index;
      searchQuery = '';
      selectedFilter = 'All';
      selectedChecklistFilter = 'All Docs';
    });
  }

  @override
  Widget build(BuildContext context) {
    int totalApplications = applications.length;
    int savedCount = savedApplications.length;
    int interviewingCount = applications
        .where((application) => application.status == 'Interviewing')
        .length;
    int offerCount =
        applications.where((application) => application.status == 'Offer').length;
    int rejectedCount = applications
        .where((application) => application.status == 'Rejected')
        .length;

    final List<JobApplication> visibleApplications = filteredApplications;

    String pageTitle =
    selectedPageIndex == 0 ? 'Recent Applications' : 'Saved Applications';

    return Scaffold(
      appBar: AppBar(
        title: const Text('TrackHire'),
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(
        child: CircularProgressIndicator(),
      )
          : ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            selectedPageIndex == 0
                ? 'Job Application Tracker'
                : 'Saved Applications',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            selectedPageIndex == 0
                ? 'Track applications, interviews, documents, and application progress in one place.'
                : 'Quickly revisit the jobs you care about most.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Total',
                  value: totalApplications.toString(),
                  icon: Icons.work_outline,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Saved',
                  value: savedCount.toString(),
                  icon: Icons.favorite_border,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Offers',
                  value: offerCount.toString(),
                  icon: Icons.star_outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  title: 'Interviewing',
                  value: interviewingCount.toString(),
                  icon: Icons.people_outline,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: StatCard(
                  title: 'Rejected',
                  value: rejectedCount.toString(),
                  icon: Icons.close,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            decoration: InputDecoration(
              labelText: 'Search applications',
              hintText:
              'Search by company, role, location, salary, or notes',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: searchQuery.isEmpty
                  ? null
                  : IconButton(
                onPressed: () {
                  setState(() {
                    searchQuery = '';
                  });
                },
                icon: const Icon(Icons.clear),
              ),
              border: const OutlineInputBorder(),
            ),
            onChanged: (value) {
              setState(() {
                searchQuery = value;
              });
            },
          ),
          const SizedBox(height: 16),
          Text(
            'Status',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (String filter in filters)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected: selectedFilter == filter,
                      onSelected: (_) {
                        setState(() {
                          selectedFilter = filter;
                        });
                      },
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Materials',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (String filter in checklistFilters)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected: selectedChecklistFilter == filter,
                      onSelected: (_) {
                        setState(() {
                          selectedChecklistFilter = filter;
                        });
                      },
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                pageTitle,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${visibleApplications.length} shown',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (selectedPageIndex == 0 && applications.isEmpty)
            const EmptyApplicationMessage()
          else if (selectedPageIndex == 1 && savedApplications.isEmpty)
            const EmptySavedMessage()
          else if (visibleApplications.isEmpty)
              EmptySearchMessage(
                onClear: clearSearchAndFilters,
              )
            else
              for (JobApplication application in visibleApplications)
                JobCard(
                  application: application,
                  onTap: () {
                    openDetailScreen(application);
                  },
                  onSavedTap: () {
                    toggleSaved(application);
                  },
                ),
        ],
      ),
      floatingActionButton: selectedPageIndex == 0
          ? FloatingActionButton.extended(
        onPressed: openAddJobScreen,
        icon: const Icon(Icons.add),
        label: const Text('Add Job'),
      )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedPageIndex,
        onDestinationSelected: changePage,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.list_alt_outlined),
            selectedIcon: Icon(Icons.list_alt),
            label: 'All',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_border),
            selectedIcon: Icon(Icons.favorite),
            label: 'Saved',
          ),
        ],
      ),
    );
  }
}