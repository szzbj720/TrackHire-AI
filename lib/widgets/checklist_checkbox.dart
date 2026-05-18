import 'package:flutter/material.dart';

class ChecklistCheckbox extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  const ChecklistCheckbox({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      title: Text(title),
      value: value,
      contentPadding: EdgeInsets.zero,
      onChanged: (newValue) {
        onChanged(newValue ?? false);
      },
    );
  }
}