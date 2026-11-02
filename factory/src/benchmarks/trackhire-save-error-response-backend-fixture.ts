import type {
  BenchmarkFixture,
} from "./benchmark-fixture-manager.js";

export const trackHireSaveErrorResponseBackendFixture:
  BenchmarkFixture = {
    path:
      "backend/factory_benchmark_save_error_response_test.js",
    content: String.raw`
const fs = require('fs');
const path = require('path');

const serverPath = path.join(
  __dirname,
  'server.js',
);

const serverSource = fs.readFileSync(
  serverPath,
  'utf8',
);

const routeStart = serverSource.indexOf(
  "app.patch('/applications/:id/save'",
);

const routeEnd = serverSource.indexOf(
  'app.listen',
  routeStart,
);

if (routeStart === -1 || routeEnd === -1) {
  throw new Error(
    'PATCH /applications/:id/save route was not found',
  );
}

const routeSource = serverSource.slice(
  routeStart,
  routeEnd,
);

function assertContains(pattern, message) {
  if (!pattern.test(routeSource)) {
    throw new Error(message);
  }
}

function assertNotContains(pattern, message) {
  if (pattern.test(routeSource)) {
    throw new Error(message);
  }
}

const criterion = process.argv[2];

switch (criterion) {
  case 'save-fetch-error-response':
    assertNotContains(
      /\bresq\b/,
      'saved-status route references an invalid response identifier',
    );

    assertContains(
      /selectError[\s\S]*?res\s*\.\s*status\s*\(\s*500\s*\)[\s\S]*?Failed to fetch updated application/,
      'post-update fetch failure does not return the intended HTTP 500 response',
    );
    break;

  case 'save-success-contract':
    assertContains(
      /res\s*\.\s*json\s*\(\s*formatApplication\s*\(\s*updatedRow\s*\)\s*\)/,
      'saved-status route does not return the updated application on success',
    );
    break;

  case 'save-not-found-contract':
    assertContains(
      /if\s*\(\s*!row\s*\)[\s\S]*?res\s*\.\s*status\s*\(\s*404\s*\)[\s\S]*?Application not found/,
      'saved-status route does not preserve its application-not-found response',
    );
    break;

  default:
    throw new Error(
      'Unknown saved-status benchmark criterion: ' + criterion,
    );
}

console.log(
  'TrackHire saved-status check passed: ' + criterion,
);
`,
  };
