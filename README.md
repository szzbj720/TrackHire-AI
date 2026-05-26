# TrackHire AI

![Flutter CI](https://github.com/szzbj720/trackhire/actions/workflows/flutter_ci.yml/badge.svg)

TrackHire AI is a full-stack Flutter mobile application designed to help job seekers organize applications, analyze job descriptions with AI, track required materials, manage interview preparation, and streamline the overall career application workflow across both Android and iOS platforms.

---

# Overview

TrackHire AI was built to solve a common problem for students and early-career professionals: managing dozens of job applications across multiple platforms becomes disorganized very quickly.

The project started as a local Flutter application with SQLite persistence and evolved into a more complete full-stack mobile platform featuring:

- Flutter frontend
- Provider state management
- MVVM-inspired architecture
- Node.js + Express REST API backend
- SQLite backend persistence
- AI-powered job analysis workflows
- CSV exporting and sharing
- GitHub Actions CI/CD
- Android + iOS simulator support

One of the core features is the AI Job Analyzer. Users can paste a real job description into the app, and the system extracts structured insights such as:

- Role title
- Company
- Salary information
- Required skills
- Preferred skills
- Recommended application materials
- Interview preparation questions
- Role summaries

Users can then directly save the generated analysis into their application tracker workflow.

---

# Screenshots

## Home Screen

![Home Screen](screenshots/home.png)

## Saved Applications

![Saved Applications](screenshots/saved.png)

## AI Job Analyzer

![AI Job Analyzer](screenshots/ai.png)

## Settings

![Settings](screenshots/settings.png)

---

# Features

## Application Tracking

- Add, edit, delete, and manage job applications
- Track statuses:
    - Applied
    - Interviewing
    - Offer
    - Rejected
- Save important applications
- Search applications by:
    - Company
    - Role
    - Location
    - Salary
    - Notes
- Track required materials:
    - Resume
    - Cover Letter
    - Portfolio
    - Application Questions
    - Other Documents

---

## AI Job Analyzer

- Analyze pasted job descriptions
- Extract structured job insights
- Generate:
    - Required skills
    - Preferred skills
    - Suggested materials
    - Interview questions
    - Role summaries
- Save AI-generated analysis directly into the application tracker

---

## Data Management

- Local SQLite persistence
- Backend SQLite persistence
- CSV export functionality
- Native mobile share-sheet integration
- Persistent application storage

---

## Backend Integration

- Flutter frontend connected to Node.js REST API
- Express backend routing
- JSON request/response handling
- Error handling for failed API connections
- Cross-platform API communication

---

## UI/UX

- Material 3 design system
- Responsive mobile layouts
- Clean pastel dashboard design
- Mobile-first interface
- Android and iOS simulator support

---

# Tech Stack

## Frontend

- Flutter
- Dart
- Material 3
- Provider
- HTTP package
- CSV package
- share_plus
- path_provider

---

## Backend

- Node.js
- Express.js
- SQLite
- REST API architecture
- CORS
- JSON serialization

---

## Architecture

- MVVM-inspired architecture
- Provider state management
- Service layer abstraction
- Reusable widget components
- Dedicated models/viewmodels/services structure

---

## AI Workflow

- AI-powered job analysis
- Structured insight extraction
- Resume/interview preparation support
- Dynamic recommendation generation

---

## DevOps & Tooling

- Git
- GitHub
- GitHub Actions CI/CD
- Flutter Analyze
- Flutter Test
- Dart Format
- Android APK builds
- Xcode iOS simulator testing

---

# Architecture Flow

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
```

---

# Project Structure

```txt
lib/
├── models/
├── providers/
├── services/
├── viewmodels/
├── screens/
├── widgets/
├── database/
└── main.dart

backend/
├── routes/
├── server.js
├── package.json
└── trackhire.db
```

---

# Supported Platforms

| Platform | Status |
|---|---|
| Android Emulator | Supported |
| Android APK | Supported |
| iOS Simulator | Supported |
| TestFlight | Planned |
| Web | Planned |

---

# CI/CD

GitHub Actions automatically performs:

- Dart formatting checks
- Flutter static analysis
- Flutter tests
- Android debug APK builds

---

# APK Download

Android APK download:

https://drive.google.com/file/d/1o03Y8E9fmwhhF-GbZhPGtK1KeHRM7P0s/view?usp=sharing

---

# Demo Workflow

Example user workflow:

1. Add and manage applications
2. Paste a real job description
3. Analyze the posting with AI
4. Generate interview preparation questions
5. Save the AI-generated application
6. Export applications as CSV
7. Share exported files natively on mobile

---

# Future Improvements

- Real OpenAI API integration
- Firebase authentication
- Cloud synchronization
- Push notifications
- Resume parsing
- Interview tracking
- TestFlight deployment
- Production App Store release
- Advanced analytics dashboard

---

# Why This Project Matters

TrackHire AI demonstrates:

- Cross-platform mobile development
- Full-stack application architecture
- REST API integration
- SQLite database management
- State management patterns
- AI workflow integration
- CI/CD automation
- Mobile UI/UX design
- Backend communication
- Real-world software engineering practices

---

# Author

Selena Zhang

GitHub:
https://github.com/szzbj720