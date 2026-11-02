import type { BenchmarkFixture } from "./benchmark-fixture-manager.js";

export const trackHireCsvMaterialsReadyExportFixture: BenchmarkFixture = {
  path: "factory_benchmark_csv_materials_ready_test.js",
  content: `const fs = require('fs');
const path = require('path');

const servicePath = path.join(
  process.cwd(),
  'lib',
  'services',
  'csv_export_service.dart',
);

const source = fs.readFileSync(servicePath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const headerMatch = source.match(
  /['"]Materials Ready['"]/,
);

assert(
  headerMatch,
  'CSV export must contain a Materials Ready header.',
);

const valueMatch = source.match(
  /checklistCompletedCount[^\\n]*\\/5|['"\`][^'"\`]*\\$\\{\\s*application\\.checklistCompletedCount\\s*\\}\\/5[^'"\`]*['"\`]/,
);

assert(
  valueMatch,
  'CSV export must write checklistCompletedCount in X/5 format.',
);

const existingHeaders = [
  'Company',
  'Role',
  'Status',
  'Date Applied',
  'Location',
  'Salary Range',
  'Notes',
  'Resume',
  'Portfolio',
  'Cover Letter',
  'Application Questions',
  'Other Materials',
  'Saved',
];

for (const header of existingHeaders) {
  assert(
    source.includes("'" + header + "'") ||
      source.includes('"' + header + '"'),
    'CSV export must preserve existing header: ' + header,
  );
}

const existingValues = [
  'application.company',
  'application.role',
  'application.status',
  'application.dateApplied',
  'application.location',
  'application.salaryRange',
  'application.notes',
  'application.hasResume',
  'application.hasPortfolio',
  'application.hasCoverLetter',
  'application.hasApplicationQuestions',
  'application.hasOther',
  'application.isSaved',
];

for (const value of existingValues) {
  assert(
    source.includes(value),
    'CSV export must preserve existing value: ' + value,
  );
}

console.log('FactoryBench CSV materials-ready contract passed.');
`,
};