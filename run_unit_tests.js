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
  clear: () => {},
};

// Mock console.assert to throw error on failure
let failures = 0;
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

// 3. Load Core Modules (Simulating ES6 imports for JSDOM)
const modules = [
    { path: 'src/core/FinanceEngine.js', global: 'FinanceEngine', type: 'class' },
    { path: 'src/ui/Components.js', type: 'functional' },
    { path: 'src/services/ApiService.js', global: 'ApiService', type: 'class' },
    { path: 'src/ui/UIManager.js', global: 'UIManager', type: 'class' }
];

modules.forEach(mod => {
    let code = fs.readFileSync(path.join(__dirname, mod.path), 'utf8');
    
    // Strip imports (JSDOM simulation environment doesn't support them in this setup)
    code = code.replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?/gm, '');

    // Remove all exports but keep the declarations and expose to window
    code = code.replace(/export const (\w+) =/g, 'const $1 = window.$1 =');
    code = code.replace(/export default class (\w+)/g, 'const $1 = window.$1 = class $1');
    
    // Fallback for when we just have "export default class" without a name
    code = code.replace(/export default class/g, `const ${mod.global} = window.${mod.global} = class`);
    
    // Final cleanup: just remove "export " if any remain
    code = code.replace(/export /g, '');

    const script = document.createElement('script');
    script.textContent = code;
    document.body.appendChild(script);
});

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
