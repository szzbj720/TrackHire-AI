import 'package:flutter/material.dart';

import 'screens/home_screen.dart';

void main() {
  runApp(const TrackHireApp());
}

class TrackHireApp extends StatelessWidget {
  const TrackHireApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TrackHire',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}