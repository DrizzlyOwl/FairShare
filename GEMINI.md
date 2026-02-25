# FairShare Context & Engineering Standards

This document serves as the foundational mandate for Gemini CLI. All development must strictly adhere to these standards to maintain the project's architectural integrity and performance.

## 🎯 Project Goal
A high-performance, framework-less web utility for proportionate bill splitting based on relative income (Gross Annual or Net Monthly). It prioritizes "naked" but polished tech (Vanilla JS/CSS) over heavy dependencies. Supports single-income households through zero-salary input validation.

## 🏗️ Technical Stack
- **Engine:** Modular Vanilla JavaScript (ES6+).
- **Architecture:** Decoupled Modular Design:
    - **`/src/core`**: Business logic (`FinanceEngine.js`) and State management (`State.js`).
    - **`/src/ui`**: View orchestration (`UIManager.js`) and Components.
    - **`/src/services`**: External APIs (`ApiService.js`) and regional lookups.
- **Documentation:** ALL additional JavaScript classes or methods must have accompanying documentation using **DocBlock** style.
- **Styling:** Modern CSS using Variables, Flexbox, and Grid. No CSS frameworks.
- **Persistence:** Managed by `State.js` with automatic `localStorage` sync via JS Proxy.

## 🎨 Styling & UI Conventions (CRITICAL)
- **BEM Pattern:** ALL components must use BEM selectors (e.g., `.card`, `.card__label`, `.card--modifier`). Avoid context-dependent nested selectors (e.g., `.parent .child`).
- **Icons:** Use the CSS `mask-image` pattern on `<span>` tags. 
  - *Implementation:* `<span class="icon-block__icon" style="mask-image: url('icons/file.svg');" aria-hidden="true"></span>`.
  - *Reason:* Allows dynamic coloring via `background-color: currentColor` or semantic variables.
- **Color Palette:** Strictly use semantic variables defined in `style.css` `:root`.
  - `var(--color-info-*)`, `var(--color-warning-*)`, `var(--color-error-*)`.
  - `var(--color-p1)` and `var(--color-p2)` for participant-specific UI.
- **Visibility:** Toggle visibility using the HTML `hidden` attribute.
- **Modularity:** New functionality must be encapsulated in the appropriate `/src` module. Avoid global scope pollution.
- **Breakpoints:** Standardized at `768px` (Tablet) and `1024px` (Desktop).
- **Typography:** Minimum font size is `1rem` (16px) across all elements to ensure readability and WCAG compliance.
- **Component Geometry:** 
  - **Toggles:** Use the `.toggle` class for binary switches (e.g., Gross/Net, Ratio/Equal). Preferred for long labels.
  - **Segmented Controls:** Use `.segmented-control` for multi-option selections (e.g., Tax Bands) with shorter labels.
  - **Dimensions:** `width: 40px` (mobile) / `48px` (tablet+) for segmented items.
  - **Alerts:** Use `createAlertHTML` in `src/ui/Components.js` as the single source of truth for programmatic generation.

## 🧪 Testing & Validation
- **Unit Tests:** `unit/tests.js` (runs in `unit/test-runner.html` or `npm run test:unit`). Verifies logic in isolation from the DOM.
- **Integration Tests:** Cypress (`npm run test:cypress`).
- **Accessibility Tests:** Cypress + Axe (`npm run test:a11y`). Target: WCAG 2.1 AA.
- **Performance:** Maintain FCP < 1.0s. Use font preloading and non-blocking CSS.

## 🔄 Workflow
1. **Research:** Map BEM impacts before changing CSS.
2. **Execute:** Apply surgical updates to `index.html`, `style.css`, and relevant modules in `/src` simultaneously.
3. **Build Tracking:** Increment the build number and update the build datetime in the `index.html` footer before EVERY push to GitHub. Always use **GMT Standard Time** for the timestamp.
4. **Verify:** Update `unit/tests.js` if component structures change.
