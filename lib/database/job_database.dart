import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../models/job_application.dart';

class JobDatabase {
  static final JobDatabase instance = JobDatabase._init();

  static Database? _database;

  JobDatabase._init();

  Future<Database> get database async {
    if (_database != null) {
      return _database!;
    }

    _database = await _initDatabase('trackhire.db');
    return _database!;
  }

  Future<Database> _initDatabase(String filePath) async {
    final String databasePath = await getDatabasesPath();
    final String path = join(databasePath, filePath);

    return openDatabase(path, version: 1, onCreate: _createDatabase);
  }

  Future<void> _createDatabase(Database db, int version) async {
    await db.execute('''
      CREATE TABLE job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        dateApplied TEXT NOT NULL,
        location TEXT NOT NULL,
        salaryRange TEXT NOT NULL,
        notes TEXT NOT NULL,
        hasResume INTEGER NOT NULL,
        hasPortfolio INTEGER NOT NULL,
        hasCoverLetter INTEGER NOT NULL,
        hasApplicationQuestions INTEGER NOT NULL,
        hasOther INTEGER NOT NULL,
        isSaved INTEGER NOT NULL
      )
    ''');
  }

  Future<int> create(JobApplication application) async {
    final Database db = await instance.database;
    return db.insert('job_applications', application.toDatabaseJson());
  }

  Future<List<JobApplication>> readAllApplications() async {
    final Database db = await instance.database;

    final List<Map<String, dynamic>> result = await db.query(
      'job_applications',
      orderBy: 'id DESC',
    );

    return result.map((json) => JobApplication.fromDatabaseJson(json)).toList();
  }

  Future<int> update(int id, JobApplication application) async {
    final Database db = await instance.database;

    return db.update(
      'job_applications',
      application.toDatabaseJson(),
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> delete(int id) async {
    final Database db = await instance.database;

    return db.delete('job_applications', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> close() async {
    final Database db = await instance.database;
    await db.close();
  }
}
