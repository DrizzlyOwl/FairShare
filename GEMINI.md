# 🛡️ FairShare: Agent Mandate

## 🎯 Vision & Principles
Maintain a high-performance, **framework-less** web utility for proportionate bill splitting. Prioritize polished "naked" tech (Vanilla JS/ES6 modules/CSS) over heavy dependencies. Support single-income scenarios via zero-salary validation.

## 🏗️ Architecture Mandates
- **Modular Decoupling:** 
    - `/src/core`: Business logic (`FinanceEngine.js`) and State management.
    - `/src/ui`: Orchestration (`UIManager.js`) and Components.
    - `/src/services`: External APIs and lookups.
- **Reactive State:** Use `State.js` (JS Proxy) for state management with automatic `localStorage` sync.
- **Strict Encapsulation:** Utilize private fields (`#`) for internal class state.
- **Documentation:** All classes and methods must use **DocBlock** style comments.

## 🎨 UI & Styling Mandates (BEM Critical)
- **CSS Methodology:** Strict **BEM** (e.g., `.card__label--active`). Avoid nested context selectors.
- **Semantic Coloring:** Exclusively use `:root` variables (e.g., `var(--color-primary)`, `var(--color-p1)`).
- **Dynamic Icons:** Use CSS `mask-image` on `<span>` tags for semantic recoloring.
- **Accessibility:** 
    - Minimum font size: `1rem` (16px).
    - Visibility: Toggle using the HTML `hidden` attribute.
    - Standard: WCAG 2.1 AA compliance.
- **Components:** 
    - Use `.toggle` for binary choices and `.segmented-control` for multi-options.
    - Centralize alert generation via `createAlertHTML` in `Components.js`.

## 🧪 Quality Gate Mandates
- **Unit Testing:** Maintain `unit/tests.js`. Test logic in isolation from the DOM.
- **Integration:** Verify user journeys via Cypress (`npm run test:cypress`).
- **Accessibility:** Run Cypress + Axe (`npm run test:a11y`) for all UI modifications.
- **Performance:** Maintain FCP < 1.0s. Use font preloading and non-blocking CSS.

## 🔄 Workflow Mandates
1. **Research:** Map BEM impacts before modifying `style.css`.
2. **Task Tracking:** Define actions in `TODO.md`; truncate upon completion.
3. **Build Tracking:** Execute `npm run bump` before EVERY push. This updates:
    - Build version and GMT footer timestamp.
    - Static asset cache busters (e.g., `?v=12345`).
4. **Versioning:** Every build bump MUST be published with a matching GitHub Tag (e.g., `v1.1.80`).
