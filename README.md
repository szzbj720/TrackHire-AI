# TrackHire

TrackHire is a cross-platform Flutter mobile app that helps job seekers organize job applications, track required materials, save important opportunities, and manage application progress in one clean workspace.

![Flutter CI](https://github.com/szzbj720/trackhire/actions/workflows/flutter_ci.yml/badge.svg)

## Overview

Job searching can get messy fast. TrackHire gives users a simple way to keep all job applications in one place, including company details, role information, application status, salary range, location, notes, saved jobs, and required application materials.

The app is built with a clean mobile-first UI, local SQLite persistence, Provider state management, and CSV export support.

## Screenshots

### Home Screen
![Home Screen](screenshots/home.png)

### Saved Applications
![Saved Applications](screenshots/saved.png)

### Settings
![Settings](screenshots/settings.png)

## Features

- Add, edit, delete, and view job applications
- Track application status: Applied, Interviewing, Offer, or Rejected
- Save important job applications to a dedicated Saved page
- Search applications by company, role, location, salary, or notes
- Filter applications by status and required materials
- Track materials such as resume, portfolio, cover letter, application questions, and other documents
- Store application data locally using SQLite
- Export job application data as a CSV file
- Share exported CSV files through the native mobile share sheet
- Clean Material 3 UI with pastel dashboard cards and responsive mobile layouts
- Organized architecture using models, screens, widgets, providers, services, and database layers

## Tech Stack

- Flutter
- Dart
- Provider
- SQLite with sqflite
- path and path_provider
- csv
- share_plus
- Material 3

## Project Structure

```txt
lib/
  main.dart
  database/
    job_database.dart
  models/
    job_application.dart
  providers/
    application_provider.dart
  screens/
    add_edit_job_screen.dart
    home_screen.dart
    job_detail_screen.dart
    settings_screen.dart
  services/
    csv_export_service.dart
  widgets/
    checklist_checkbox.dart
    detail_section.dart
    empty_application_message.dart
    empty_saved_message.dart
    empty_search_message.dart
    job_card.dart
    materials_section.dart
    stat_card.dart