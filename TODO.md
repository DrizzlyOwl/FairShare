# FairShare ES6 Modular Migration Roadmap

This document outlines the sequential steps required to refactor the procedural `app.js` into a decoupled, modular ES6 architecture.

## 🏗️ Phase 1: Engine Extraction (Calculation Foundation)
- [x] Scaffold directory structure: `/src/core`, `/src/ui`, `/src/services`.
- [x] Create `src/core/FinanceEngine.js` and extract pure math logic:
    - [x] `calculateTakeHome` (UK Tax/NI logic).
    - [x] `calculateStampDuty` & `TAX_BRACKETS`.
    - [x] `calculateTieredTax` utility.
    - [x] Mortgage Amortization formula.
- [x] Update `unit/tests.js` to import and verify `FinanceEngine.js` in isolation.

## 💾 Phase 2: State Management & Persistence
- [x] Implement `src/core/State.js` class:
    - [x] Private `#data` field with `appData` defaults.
    - [x] `update(newData)` method with callback trigger.
    - [x] `persist()` and `hydrate()` for `localStorage`.
- [x] Implement JS Proxy integration for automatic state persistence.

## 🌐 Phase 3: External Services & API
- [x] Implement `src/services/ApiService.js` class:
    - [x] Port `getEstimatedPropertyPrice` (SPARQL).
    - [x] Port `checkRegion` and `REGIONS` data.
    - [x] Port `estimateWaterCost`.
- [x] Ensure all methods are decoupled from the DOM (pass primitives, return data).

## 🎨 Phase 4: UI & View Management
- [x] Create `src/ui/Components.js`:
    - [x] Port `createAlertHTML`.
    - [x] Port `formatCurrency` and `Intl.NumberFormat` instances.
- [x] Implement `src/ui/UIManager.js` class:
    - [x] Element caching logic.
    - [x] Screen transition & progress bar logic.
    - [x] Pagination & button visibility logic.
    - [x] Centralized `render(state)` method for dynamic UI updates.

## 🔌 Phase 5: Orchestration (The "Big Switch")
- [x] Refactor `index.html`:
    - [x] Change to `<script type="module" src="src/main.js"></script>`.
- [x] Implement `src/main.js`:
    - [x] Initialize `State`, `UIManager`, and `ApiService`.
    - [x] Refactor `FORM_FIELDS` loop into a centralized event delegation system.
    - [x] Wire state updates to UI render cycles.
- [x] Legacy Cleanup: Remove all `window.*` exports and the original `app.js`.

## 🏁 Phase 6: Validation & Metadata
- [x] E2E Verification: Run full Cypress integration suite.
- [x] Accessibility Audit: Verify focus management and WCAG AA compliance.
- [x] Build Update: Increment build to `1.1.0` and update GMT timestamp.
- [x] Update `GEMINI.md`: Document new modular standards.
