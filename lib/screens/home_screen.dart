import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/job_application.dart';
import '../providers/application_provider.dart';
import '../widgets/empty_application_message.dart';
import '../widgets/empty_saved_message.dart';
import '../widgets/empty_search_message.dart';
import '../widgets/job_card.dart';
import '../widgets/stat_card.dart';
import 'add_edit_job_screen.dart';
import 'job_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> openAddJobScreen(BuildContext context) async {
    final ApplicationProvider provider = context.read<ApplicationProvider>();

    final newApplication = await Navigator.push<JobApplication>(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditJobScreen(),
      ),
    );

    if (newApplication != null) {
      await provider.addApplication(newApplication);
    }
  }

  Future<void> openDetailScreen(
      BuildContext context,
      JobApplication selectedApplication,
      ) async {
    final ApplicationProvider provider = context.read<ApplicationProvider>();
    final int originalIndex = provider.applications.indexOf(selectedApplication);

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
      await provider.deleteApplication(originalIndex);
      return;
    }

    if (result.updatedApplication != null) {
      await provider.updateApplication(
        originalIndex,
        result.updatedApplication!,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ApplicationProvider provider = context.watch<ApplicationProvider>();

    final List<JobApplication> visibleApplications =
        provider.filteredApplications;

    String pageTitle = provider.selectedPageIndex == 0
        ? 'Recent Applications'
        : 'Saved Applications';

    return Scaffold(
      appBar: AppBar(
        title: const Text('TrackHire'),
        centerTitle: true,
      ),
      body: provider.isLoading
          ? const Center(
        child: CircularProgressIndicator(),
      )
          : ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          Text(
            provider.selectedPageIndex == 0
                ? 'Job Application Tracker'
                : 'Saved Applications',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            provider.selectedPageIndex == 0
                ? 'Track applications, interviews, documents, and application progress in one place.'
                : 'Quickly revisit the jobs you care about most.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),

          SizedBox(
            height: 128,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                SizedBox(
                  width: 132,
                  child: StatCard(
                    title: 'Total',
                    value: provider.totalApplications.toString(),
                    icon: Icons.work_outline,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 132,
                  child: StatCard(
                    title: 'Saved',
                    value: provider.savedCount.toString(),
                    icon: Icons.favorite_border,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 132,
                  child: StatCard(
                    title: 'Offers',
                    value: provider.offerCount.toString(),
                    icon: Icons.star_outline,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 148,
                  child: StatCard(
                    title: 'Interviewing',
                    value: provider.interviewingCount.toString(),
                    icon: Icons.people_outline,
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 132,
                  child: StatCard(
                    title: 'Rejected',
                    value: provider.rejectedCount.toString(),
                    icon: Icons.close,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          TextField(
            decoration: InputDecoration(
              labelText: 'Search applications',
              hintText:
              'Search by company, role, location, salary, or notes',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: provider.searchQuery.isEmpty
                  ? null
                  : IconButton(
                onPressed: provider.clearSearchQuery,
                icon: const Icon(Icons.clear),
              ),
              border: const OutlineInputBorder(),
            ),
            onChanged: provider.setSearchQuery,
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
                for (String filter in provider.filters)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected: provider.selectedFilter == filter,
                      onSelected: (_) {
                        provider.setStatusFilter(filter);
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
                for (String filter in provider.checklistFilters)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(filter),
                      selected:
                      provider.selectedChecklistFilter == filter,
                      onSelected: (_) {
                        provider.setChecklistFilter(filter);
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

          if (provider.selectedPageIndex == 0 &&
              provider.applications.isEmpty)
            const EmptyApplicationMessage()
          else if (provider.selectedPageIndex == 1 &&
              provider.savedApplications.isEmpty)
            const EmptySavedMessage()
          else if (visibleApplications.isEmpty)
              EmptySearchMessage(
                onClear: provider.clearSearchAndFilters,
              )
            else
              for (JobApplication application in visibleApplications)
                JobCard(
                  application: application,
                  onTap: () {
                    openDetailScreen(context, application);
                  },
                  onSavedTap: () {
                    provider.toggleSaved(application);
                  },
                ),
        ],
      ),
      floatingActionButton: provider.selectedPageIndex == 0
          ? FloatingActionButton.extended(
        onPressed: () {
          openAddJobScreen(context);
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Job'),
      )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: provider.selectedPageIndex,
        onDestinationSelected: provider.changePage,
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