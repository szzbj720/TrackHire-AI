import type {
    BenchmarkFixture,
  } from "./benchmark-fixture-manager.js";
  
  export const trackHireApplicationSourceBackendFixture:
    BenchmarkFixture = {
      path:
        "backend/factory_benchmark_application_source_test.js",
  
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
  
  function assertContains(
    pattern,
    message,
  ) {
    if (!pattern.test(serverSource)) {
      throw new Error(message);
    }
  }
  
  assertContains(
    /\bsource\b/,
    'backend server.js does not reference source',
  );
  
  assertContains(
    /CREATE TABLE IF NOT EXISTS applications[\s\S]*?\bsource\b/i,
    'applications SQLite schema does not persist source',
  );
  
  assertContains(
    /formatApplication[\s\S]*?\bsource\s*:\s*row\.source\b/,
    'formatApplication does not return source',
  );
  
  assertContains(
    /POST\s*['"]\/applications['"][\s\S]*?\bsource\b/,
    'POST /applications does not handle source',
  );
  
  assertContains(
    /INSERT INTO applications[\s\S]*?\bsource\b/i,
    'POST /applications does not persist source',
  );
  
  assertContains(
    /PUT\s*['"]\/applications\/:id['"][\s\S]*?\bsource\b/,
    'PUT /applications/:id does not handle source',
  );
  
  assertContains(
    /UPDATE applications SET[\s\S]*?\bsource\s*=\s*\?/i,
    'PUT /applications/:id does not persist source',
  );
  
  console.log(
    'TrackHire application source backend checks passed.',
  );
  `,
    };