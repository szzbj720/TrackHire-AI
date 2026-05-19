# TrackHire AI

![Flutter CI](https://github.com/szzbj720/trackhire/actions/workflows/flutter_ci.yml/badge.svg)

TrackHire AI is a full-stack Flutter career management app that helps job seekers organize applications, analyze job descriptions, track required materials, save important opportunities, and prepare for interviews in one clean mobile workspace.

## Overview

Job searching can get messy fast. TrackHire AI gives users a structured way to manage job applications, including company details, role information, application status, salary range, location, notes, saved jobs, and required application materials.

The app started as a local Flutter application with SQLite persistence and later expanded into a backend-connected mobile platform. TrackHire AI now includes a Flutter frontend, Provider-based state management, an MVVM-inspired AI workflow, a dedicated API service layer, a Node.js and Express REST API, persistent backend SQLite storage, CSV export support, and GitHub Actions CI.

One of the main upgrades is the AI Job Analyzer. Users can paste a job description, and the app extracts structured insights such as role title, company, location, salary range, required skills, preferred skills, recommended materials, role summary, and tailored interview preparation questions. The generated analysis can then be saved directly as a real job application in TrackHire AI.

## Screenshots

### Home Screen

![Home Screen](screenshots/home.png)

### Saved Applications

![Saved Applications](screenshots/saved.png)

### AI Job Analyzer

![AI Job Analyzer](screenshots/ai.png)

### Settings

![Settings](screenshots/settings.png)

## Features

- Add, edit, delete, and view job applications
- Track application status: Applied, Interviewing, Offer, or Rejected
- Save important job applications to a dedicated Saved page
- Search applications by company, role, location, salary, or notes
- Filter applications by status and required materials
- Track materials such as resume, portfolio, cover letter, application questions, and other documents
- View dashboard stats for total applications, saved jobs, offers, interviews, and rejections
- Analyze pasted job descriptions with an AI-powered job analyzer
- Extract role title, company, location, salary range, required skills, preferred skills, and recommended materials
- Generate role summaries and tailored interview preparation questions
- Save AI-generated job analysis directly as a TrackHire application
- Export job application data as a CSV file
- Share exported CSV files through the native mobile share sheet
- Connect the Flutter app to a Node.js and Express REST API
- Persist backend data using SQLite
- Handle API connection errors with a user-friendly error state
- Use a clean Material 3 UI with pastel dashboard cards and responsive mobile layouts
- Organize code with models, screens, views, widgets, providers, viewmodels, services, database, and backend layers
- Validate code quality through GitHub Actions CI for formatting, static analysis, testing, and Android debug APK builds

## Tech Stack

### Frontend

- Flutter
- Dart
- Provider
- Material 3
- http
- csv
- share_plus
- path_provider

### Architecture and State Management

- Provider state management
- MVVM-inspired AI workflow
- Dedicated model layer
- Dedicated service layer
- Dedicated viewmodel layer
- Reusable widget components
- JSON serialization

### AI Features

- AI-powered job description analysis
- Structured job insight extraction
- Required and preferred skill detection
- Recommended materials generation
- Interview question generation
- Save AI analysis into application workflow

### Local Data and App Services

- SQLite with sqflite
- Local model serialization
- CSV export service
- Native share-sheet integration

### Backend

- Node.js
- Express
- SQLite
- CORS
- REST API
- JSON request and response handling
- Persistent backend storage

### Development Tools

- Git
- GitHub
- GitHub Actions CI/CD
- Android Studio
- Dart Format
- Flutter Analyze
- Flutter Test
- Android debug APK builds

## Architecture

```txt
Flutter UI
  ↓
Provider State Management
  ↓
ViewModel Layer
  ↓
Service Layer
  ↓
ApiService / AIService
  ↓
Node.js / Express REST API
  ↓
SQLite Backend Database