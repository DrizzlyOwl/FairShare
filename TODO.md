[x] Update package dependencies and fix vulnerabilities (jsdom 28.1.0).
# FairShare TODOs

[x] Implement Computed Properties in State.js to automatically derive income ratios and take-home estimates whenever base salary values change.
[x] Integrate Student Loan plans and Pension contribution percentages into FinanceEngine.js and add UI controls to the Income screen.
[x] Implement URL Serialization & Sharing:
    - [x] Create `UrlService.js` to handle Base64 encoding/decoding of application state.
    - [x] Implement automatic URL hash updates whenever state changes (throttled).
    - [x] Add state hydration from URL hash on initial load (with migration support).
    - [x] Add "Share" button to header that copies the shareable URL to clipboard.
    - [x] Add visual feedback (Toast/Alert) when URL is copied.
[x] Transition to self-hosted Inter variable font in the dist/ directory to eliminate external requests and optimize font rendering performance.
[ ] Add a real-time micro-summary UI component that displays running contribution totals as users modify individual bill split rules.
[x] Implement state schema versioning and a migration utility in State.js to ensure backward compatibility with cached localStorage data.
[x] Implement a JavaScript Logger module that all of the other modules can extend for writing debug messages into the JS Console.
