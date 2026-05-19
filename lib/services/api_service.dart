import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/job_application.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:3000';

  static Future<List<JobApplication>> fetchApplications() async {
    final Uri url = Uri.parse('$baseUrl/applications');

    final http.Response response = await http.get(url);

    if (response.statusCode != 200) {
      throw Exception('Failed to load applications.');
    }

    final List<dynamic> data = jsonDecode(response.body);

    return data.map((json) => JobApplication.fromApiJson(json)).toList();
  }

  static Future<JobApplication> createApplication(
    JobApplication application,
  ) async {
    final Uri url = Uri.parse('$baseUrl/applications');

    final http.Response response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(application.toApiJson()),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to create application.');
    }

    final Map<String, dynamic> data = jsonDecode(response.body);

    return JobApplication.fromApiJson(data);
  }

  static Future<JobApplication> updateApplication(
    int id,
    JobApplication application,
  ) async {
    final Uri url = Uri.parse('$baseUrl/applications/$id');

    final http.Response response = await http.put(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(application.toApiJson()),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update application.');
    }

    final Map<String, dynamic> data = jsonDecode(response.body);

    return JobApplication.fromApiJson(data);
  }

  static Future<void> deleteApplication(int id) async {
    final Uri url = Uri.parse('$baseUrl/applications/$id');

    final http.Response response = await http.delete(url);

    if (response.statusCode != 200) {
      throw Exception('Failed to delete application.');
    }
  }

  static Future<JobApplication> toggleSaved(int id) async {
    final Uri url = Uri.parse('$baseUrl/applications/$id/save');

    final http.Response response = await http.patch(url);

    if (response.statusCode != 200) {
      throw Exception('Failed to update saved status.');
    }

    final Map<String, dynamic> data = jsonDecode(response.body);

    return JobApplication.fromApiJson(data);
  }
}
