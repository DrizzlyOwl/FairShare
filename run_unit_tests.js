const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// 1. Setup JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  resources: 'usable',
  runScripts: 'dangerously',
});

const { window } = dom;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Mock console.assert to throw error on failure
let failures = 0;
const originalAssert = console.assert;
console.assert = (condition, message) => {
  if (!condition) {
    failures++;
    process.stdout.write(`\nASSERTION FAILED: ${message}\n`);
  }
};

const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
};

const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
};

// 3. Load app.js (it will attach functions to window)
const appJsCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const appScript = document.createElement('script');
appScript.textContent = appJsCode;
document.body.appendChild(appScript);

// 4. Load and run unit/tests.js
const testsJsCode = fs.readFileSync(path.join(__dirname, 'unit', 'tests.js'), 'utf8');
const testsScript = document.createElement('script');
testsScript.textContent = testsJsCode;

console.log('--- Starting Unit Tests ---');
try {
  document.body.appendChild(testsScript);
} catch (e) {
  failures++;
  console.error('Test execution threw an error:', e);
}
console.log('--- Unit Tests Finished ---');

// 5. Exit with appropriate code
if (failures > 0) {
  console.error(`${failures} assertions failed.`);
  process.exit(1);
} else {
  console.log('All unit tests passed!');
  process.exit(0);
}
