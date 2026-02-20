# FairShare Context & Engineering Standards

This document serves as the foundational mandate for Gemini CLI. All development must strictly adhere to these standards to maintain the project's architectural integrity and performance.

## 🎯 Project Goal
A high-performance, framework-less web utility for proportionate bill splitting based on relative income. It prioritizes "naked" but polished tech (Vanilla JS/CSS) over heavy dependencies.

## 🏗️ Technical Stack
- **Engine:** Vanilla JavaScript (ES6+).
- **Styling:** Modern CSS using Variables, Flexbox, and Grid. No CSS frameworks.
- **Architecture:** BEM (Block, Element, Modifier) naming convention.
- **Persistence:** `localStorage` for session state.
- **Features:** PWA (Service Workers), Land Registry SPARQL integration, CSV Export.

## 🎨 Styling & UI Conventions (CRITICAL)
- **BEM Pattern:** ALL components must use BEM selectors (e.g., `.card`, `.card__label`, `.card--modifier`). Avoid context-dependent nested selectors (e.g., `.parent .child`).
- **Icons:** Use the CSS `mask-image` pattern on `<span>` tags. 
  - *Implementation:* `<span class="icon-block__icon" style="mask-image: url('icons/file.svg');" aria-hidden="true"></span>`.
  - *Reason:* Allows dynamic coloring via `background-color: currentColor` or semantic variables.
- **Color Palette:** Strictly use semantic variables defined in `style.css` `:root`.
  - `var(--color-info-*)`, `var(--color-warning-*)`, `var(--color-error-*)`.
  - `var(--color-p1)` and `var(--color-p2)` for participant-specific UI.
- **Visibility:** Toggle visibility using the HTML `hidden` attribute (`element.setAttribute('hidden', '')` / `removeAttribute('hidden')`) rather than `style.display`.
- **Breakpoints:** Standardized at `768px` (Tablet) and `1024px` (Desktop).
- **Component Geometry:** 
  - Segmented controls: `width: 40px` (mobile) / `48px` (tablet+).
  - Alerts: Use `window.createAlertHTML` in `app.js` as the single source of truth for programmatic generation.

## 🧪 Testing & Validation
- **Unit Tests:** `unit/tests.js` (runs in `unit/test-runner.html`).
- **Integration Tests:** Cypress (maintained separately).
- **Performance:** Maintain FCP < 1.0s. Use font preloading and non-blocking CSS.

## 🔄 Workflow
1. **Research:** Map BEM impacts before changing CSS.
2. **Execute:** Apply surgical updates to `index.html`, `style.css`, and `app.js` simultaneously.
3. **Verify:** Update `unit/tests.js` if component structures change.
