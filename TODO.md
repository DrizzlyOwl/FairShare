# FairShare Optimization TODO

## 🚀 Performance & Memory
- [x] Refactor `State.js` Proxy to avoid recursive creation on every `get`.
- [x] Fix redundant `onUpdate` calls in `State.update()`.
- [x] Implement robust debounce for `State.persist()` (localStorage sync).
- [x] Optimize DOM updates in `UIManager` to avoid `outerHTML` and re-caching where possible. (Partially done: focused on decoupling and orchestrator-driven updates).

## 🏗️ Architecture & Maintainability
- [x] Decouple `UIManager` from global `app` object (remove `window.app` calls).
- [x] Centralize NI rates and thresholds in `Constants.js`.
- [x] Move "orchestration" logic (e.g. `calculateRatio`, `calculateEquityDetails`) from `main.js` to a new `FinanceOrchestrator.js`.
- [x] Implement declarative event binding in `main.js` using `FORM_FIELDS`.
- [x] Ensure all business logic in `FinanceEngine.js` is pure and unit-tested.

## 🧪 Testing & Validation
- [x] Update `run_unit_tests.js` to cover new orchestrator.
- [x] Verify unit tests pass after refactoring.
