````markdown
# TrackHire AI

![Flutter CI](https://github.com/szzbj720/trackhire/actions/workflows/flutter_ci.yml/badge.svg)

TrackHire AI is a mobile app I built to help job seekers stay organized during the application process. I started this project because I was applying to a lot of internships and new grad roles, and I kept running into the same problem: my applications, job descriptions, deadlines, notes, and interview prep were spread across different tabs, spreadsheets, and random documents.

Instead of treating job searching as just a list of companies, I wanted to build something that felt closer to a personal job search workspace. The app lets users track applications, save important roles, organize required materials, and use AI to break down job descriptions into useful next steps.

---

## Demo Video

A short walkthrough of the main application tracking flow, saved jobs page, AI job analyzer, and settings page.

https://github.com/user-attachments/assets/42c91ef6-a733-48a4-aea2-1aaa86538415

---

## Why I Built This

During my own job search, I realized that the hardest part was not just finding jobs. It was keeping track of everything after applying.

I would have one job description saved in a browser tab, another company in a spreadsheet, notes in a document, and interview questions somewhere else. After a while, it became hard to remember which applications needed a cover letter, which ones I wanted to follow up on, and which roles were actually good matches for my experience.

That is what led me to build TrackHire AI.

My goal was to create a simple mobile app that could help someone manage the whole job application process in one place. I also wanted to explore how AI could be used in a practical way, not just as a chatbot, but as part of a real workflow where a user can paste a job description, understand what the role is asking for, and save that information directly into their tracker.

---

## What the App Does

TrackHire AI lets users:

- Add and manage job applications
- Track each application by status
- Save important roles
- Search through applications
- Track required materials like resumes, cover letters, portfolios, and application questions
- Paste job descriptions into an AI analyzer
- Generate structured job insights and interview preparation questions
- Save AI-generated job analysis into the main tracker
- Export application data as a CSV file
- Share exported files using the native mobile share sheet

The app supports both Android and iOS simulator testing.

---

## Screenshots

### Home Screen

![Home Screen](screenshots/home.png)

### Saved Applications

![Saved Applications](screenshots/saved.png)

### AI Job Analyzer

![AI Job Analyzer](screenshots/ai.png)

### Settings

![Settings](screenshots/settings.png)

---

## How I Designed the App

I wanted the app to feel simple and practical. Since job searching can already feel overwhelming, I did not want the interface to look too complicated or overloaded.

The main screen focuses on the applications themselves. From there, users can quickly see where each application stands, search through their list, or add a new one. I also added a saved applications page because I personally like separating roles that feel especially important from the full application list.

For the AI feature, I wanted it to fit naturally into the app instead of feeling like a separate tool. The user can paste a job description, get a structured breakdown, and then save that result directly into the tracker. This made the AI feature feel connected to the actual job search process rather than being a standalone experiment.

---

## Technical Approach

I built the frontend with Flutter because I wanted one codebase that could run on both Android and iOS. This also gave me more practice thinking about cross-platform mobile development, responsive layouts, and simulator testing on different devices.

For state management, I used Provider and organized the app with an MVVM-inspired structure. I separated the project into models, services, viewmodels, screens, and reusable widgets so that the app would be easier to maintain as I added more features.

The app also includes a Node.js and Express backend with SQLite persistence. I wanted to practice connecting a mobile frontend to a backend API, handling JSON request and response data, and thinking through how data should move between the UI, service layer, backend routes, and database.

---

## Architecture Flow

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
````

---

## Tech Stack

### Frontend

* Flutter
* Dart
* Material 3
* Provider
* HTTP package
* CSV package
* share_plus
* path_provider

### Backend

* Node.js
* Express.js
* SQLite
* REST API architecture
* CORS
* JSON serialization

### Tooling

* Git
* GitHub
* GitHub Actions
* Flutter Analyze
* Flutter Test
* Dart Format
* Android APK builds
* Xcode iOS Simulator

---

## Project Structure

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

screenshots/
├── home.png
├── saved.png
├── ai.png
└── settings.png
```

---

## AI Job Analyzer

One of the main features I wanted to experiment with was AI-assisted job analysis.

The user can paste a job description, and the app extracts information such as:

* Company
* Role title
* Location
* Salary range
* Required skills
* Preferred skills
* Recommended application materials
* Interview preparation questions
* A short role summary

I built this because job descriptions can be long and difficult to process quickly, especially when applying to many roles. The goal was to help users understand what a role is really asking for and turn that information into something they can act on.

The most important part of this feature was making the AI output useful inside the app. Instead of only showing the generated analysis once, I added the ability to save AI-generated job analysis into the main tracker, which made the feature feel more useful and realistic.

---

## CI/CD

I added a GitHub Actions workflow to make the project more reliable as I continued building.

The workflow checks:

* Dart formatting
* Flutter static analysis
* Flutter tests
* Android debug APK builds

This helped me catch issues earlier and gave me experience setting up a basic mobile CI pipeline.

---

## APK Download

Android APK download:

https://drive.google.com/file/d/1o03Y8E9fmwhhF-GbZhPGtK1KeHRM7P0s/view?usp=sharing

---

## What I Learned

This project helped me practice building a mobile app beyond just the UI layer. I worked through the process of structuring a Flutter project, managing state, connecting to a backend, saving data, exporting files, and testing on both Android and iOS.

Some of the biggest things I learned were:

* How to organize a larger Flutter app using models, services, viewmodels, and screens
* How Provider can be used to manage app-wide state
* How to connect a mobile frontend to a REST API
* How to use SQLite for persistent storage
* How to design a feature so that AI output fits into a real user workflow
* How to debug platform-specific issues across Android and iOS
* How to set up GitHub Actions for formatting, analysis, testing, and builds
* How to think more carefully about product flow, not just individual features

One challenge I ran into was keeping the AI feature connected to the rest of the app. At first, it felt like a separate tool. I improved this by adding the ability to save AI-generated job analysis into the main tracker, which made the feature feel more useful and realistic.

---

## Future Improvements

There are several features I would like to add next:

* User authentication
* Cloud synchronization across devices
* Resume parsing
* Interview date tracking
* Push notification reminders
* More advanced analytics for application progress
* TestFlight deployment
* Production App Store release
* Multi-device syncing

---

## Why This Project Matters To Me

TrackHire AI is meaningful to me because it came from a real problem I experienced while applying for jobs. I wanted to build something that could help students and early-career developers feel less overwhelmed during the application process.

It also gave me a chance to combine several areas I have been learning: mobile development, backend APIs, databases, AI workflows, and CI/CD. More importantly, it helped me practice thinking like a developer building for an actual user, not just completing a class assignment.

---

## Author

Selena Zhang

GitHub:
https://github.com/szzbj720

```
```
