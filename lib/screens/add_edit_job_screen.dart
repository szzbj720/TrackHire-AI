import 'package:flutter/material.dart';

import '../models/job_application.dart';
import '../widgets/checklist_checkbox.dart';

class AddEditJobScreen extends StatefulWidget {
  final JobApplication? existingApplication;

  const AddEditJobScreen({
    super.key,
    this.existingApplication,
  });

  @override
  State<AddEditJobScreen> createState() => _AddEditJobScreenState();
}

class _AddEditJobScreenState extends State<AddEditJobScreen> {
  final TextEditingController companyController = TextEditingController();
  final TextEditingController roleController = TextEditingController();
  final TextEditingController dateController = TextEditingController();
  final TextEditingController locationController = TextEditingController();
  final TextEditingController salaryRangeController = TextEditingController();
  final TextEditingController notesController = TextEditingController();

  String selectedStatus = 'Applied';

  bool hasResume = false;
  bool hasPortfolio = false;
  bool hasCoverLetter = false;
  bool hasApplicationQuestions = false;
  bool hasOther = false;
  bool isSaved = false;

  final List<String> statuses = [
    'Applied',
    'Interviewing',
    'Offer',
    'Rejected',
  ];

  bool get isEditing {
    return widget.existingApplication != null;
  }

  @override
  void initState() {
    super.initState();

    final existingApplication = widget.existingApplication;

    if (existingApplication != null) {
      companyController.text = existingApplication.company;
      roleController.text = existingApplication.role;
      dateController.text = existingApplication.dateApplied;
      locationController.text = existingApplication.location;
      salaryRangeController.text = existingApplication.salaryRange;
      notesController.text = existingApplication.notes;
      selectedStatus = existingApplication.status;
      hasResume = existingApplication.hasResume;
      hasPortfolio = existingApplication.hasPortfolio;
      hasCoverLetter = existingApplication.hasCoverLetter;
      hasApplicationQuestions = existingApplication.hasApplicationQuestions;
      hasOther = existingApplication.hasOther;
      isSaved = existingApplication.isSaved;
    }
  }

  @override
  void dispose() {
    companyController.dispose();
    roleController.dispose();
    dateController.dispose();
    locationController.dispose();
    salaryRangeController.dispose();
    notesController.dispose();
    super.dispose();
  }

  void saveApplication() {
    if (companyController.text.isEmpty || roleController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a company and role.'),
        ),
      );
      return;
    }

    final savedApplication = JobApplication(
      company: companyController.text,
      role: roleController.text,
      status: selectedStatus,
      dateApplied:
      dateController.text.isEmpty ? 'No date added' : dateController.text,
      location: locationController.text.isEmpty
          ? 'No location added'
          : locationController.text,
      salaryRange: salaryRangeController.text.isEmpty
          ? 'No salary added'
          : salaryRangeController.text,
      notes:
      notesController.text.isEmpty ? 'No notes added.' : notesController.text,
      hasResume: hasResume,
      hasPortfolio: hasPortfolio,
      hasCoverLetter: hasCoverLetter,
      hasApplicationQuestions: hasApplicationQuestions,
      hasOther: hasOther,
      isSaved: isSaved,
    );

    Navigator.pop(context, savedApplication);
  }

  @override
  Widget build(BuildContext context) {
    String pageTitle = isEditing ? 'Edit Application' : 'Add Application';
    String heading = isEditing ? 'Update Job Application' : 'New Job Application';
    String buttonText = isEditing ? 'Save Changes' : 'Save Application';

    return Scaffold(
      appBar: AppBar(
        title: Text(pageTitle),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            heading,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isEditing
                ? 'Edit the details for this application.'
                : 'Add the key details for a job you applied to.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          TextField(
            controller: companyController,
            decoration: const InputDecoration(
              labelText: 'Company',
              hintText: 'Example: Apple',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: roleController,
            decoration: const InputDecoration(
              labelText: 'Role',
              hintText: 'Example: Mobile Developer',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: selectedStatus,
            decoration: const InputDecoration(
              labelText: 'Status',
              border: OutlineInputBorder(),
            ),
            items: statuses.map((status) {
              return DropdownMenuItem(
                value: status,
                child: Text(status),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  selectedStatus = value;
                });
              }
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: dateController,
            decoration: const InputDecoration(
              labelText: 'Date Applied',
              hintText: 'Example: May 17, 2026',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: locationController,
            decoration: const InputDecoration(
              labelText: 'Location',
              hintText: 'Example: Remote, New York, NY',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: salaryRangeController,
            decoration: const InputDecoration(
              labelText: 'Salary Range',
              hintText: 'Example: \$90k - \$120k',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Application Materials',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          ChecklistCheckbox(
            title: 'Resume',
            value: hasResume,
            onChanged: (value) {
              setState(() {
                hasResume = value;
              });
            },
          ),
          ChecklistCheckbox(
            title: 'Portfolio',
            value: hasPortfolio,
            onChanged: (value) {
              setState(() {
                hasPortfolio = value;
              });
            },
          ),
          ChecklistCheckbox(
            title: 'Cover Letter',
            value: hasCoverLetter,
            onChanged: (value) {
              setState(() {
                hasCoverLetter = value;
              });
            },
          ),
          ChecklistCheckbox(
            title: 'Application Questions',
            value: hasApplicationQuestions,
            onChanged: (value) {
              setState(() {
                hasApplicationQuestions = value;
              });
            },
          ),
          ChecklistCheckbox(
            title: 'Other',
            value: hasOther,
            onChanged: (value) {
              setState(() {
                hasOther = value;
              });
            },
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Save to favorites'),
            subtitle: const Text('Show this application on the Saved page'),
            value: isSaved,
            contentPadding: EdgeInsets.zero,
            onChanged: (value) {
              setState(() {
                isSaved = value;
              });
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: notesController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Notes',
              hintText: 'Example: Follow up with recruiter next week.',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: saveApplication,
            icon: const Icon(Icons.save),
            label: Text(buttonText),
          ),
        ],
      ),
    );
  }
}