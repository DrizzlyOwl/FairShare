# FairShare - Fair Bill Splitting Calculator

**FairShare** is a modern, high-performance web utility designed to help couples determine a fair and proportionate way to split household expenses. By moving beyond the standard 50/50 split—which can be inequitable when salaries differ significantly—this tool calculates contributions based on each partner's relative earning power.

## 🌟 Project Overview

FairShare automates household budgeting by establishing a contribution ratio based on relative income. It ensures both partners retain a fair share of disposable income, removing financial friction. The application guides users through a 7-step process to estimate property values, regional running costs, and shared lifestyle expenses, resulting in a detailed proportionate split report.

### Key Features
- **Smart Ratio Calculation**: Automatically estimates net monthly take-home pay (after tax and NI) to ensure contribution ratios are truly fair, even when providing annual gross figures.
- **Flexible Income Input**: Toggle between **Annual Gross** or **Monthly Net** salary modes.
- **Tax & Take-Home Preview**: Provides real-time estimates of your UK Tax Band and monthly take-home pay as you type.
- **Comprehensive Upfront Planning**:
    - Specify deposits as either a **Percentage** or a **Fixed Amount**.
    - Include optional **Mortgage Product Fees** in your initial cash requirements.
    - Automatic estimates for **Stamp Duty (SDLT)** and **Legal Fees**.
- **Detailed Financial Roadmap**: A final report that clearly separates **Initial Upfront Costs** from **Ongoing Monthly Shares**.
- **Real-World Data Integration**: Fetches estimated property values via the UK Land Registry SPARQL endpoint.
- **Regional cost Adjustments**: Automates utility and Council Tax estimates based on your specific postcode and property size.
- **Accessibility First**: Fully **WCAG 2.1 AA** compliant with dark mode support and a focus on legible typography (min 16px).
- **PWA Ready**: Works offline and is installable as a standalone utility.

## 🏗️ Technical Architecture

FairShare is built using a **Decoupled Modular Design** powered by ES6 modules. This architecture ensures high maintainability and testability without the overhead of a framework.

### 1. Core Concepts & Design Patterns

- **Reactive State (Proxy Pattern)**: The application state in `State.js` is wrapped in a Javascript Proxy. Any modification to the state automatically triggers a UI render and a throttled persistence write to `localStorage`.
- **Pure Functional Logic**: All financial calculations in `FinanceEngine.js` are pure functions. They take inputs and return outputs with zero side effects or DOM dependencies, making them highly testable via JSDOM.
- **Orchestration Layer**: `FinanceOrchestrator.js` serves as the "brain" of the application, coordinating complex flows between the state and the engine.
- **Specialized Controllers**:
    - **`NavigationController`**: Manages the screen-to-screen lifecycle, hash-based routing, and global keyboard navigation.
    - **`FormController`**: Handles complex input life-cycles, real-time formatting, and screen-level validation.
    - **`UIManager`**: Orchestrates view state transitions, progress tracking, and BEM-compliant DOM updates.

### 2. Developer Workflow: Adding a New Feature

To maintain architectural integrity, follow this lifecycle when adding new functionality:

1.  **Define State**: Add new keys to `INITIAL_STATE` in `src/core/State.js`.
2.  **Update Constants**: If the feature requires new fields or screen IDs, update `src/core/Constants.js`.
3.  **Implement Pure Logic**: Add necessary calculation methods to `src/core/FinanceEngine.js`.
4.  **Update Orchestrator**: Create a method in `src/core/FinanceOrchestrator.js` to bridge the new logic with the application state.
5.  **Declare Validation**: Add field or screen-level rules to `src/core/Validator.js`.
6.  **Update UI**:
    - Add HTML structure in `index.html` using **BEM** selectors.
    - Add styling in `style.css`.
    - Implement rendering logic in `src/ui/UIManager.js`.
7.  **Bind Events**: Connect the new UI elements in `src/ui/FormController.js` or `src/main.js`.
8.  **Verify**: Add unit tests in `unit/tests.js` and integration tests in `cypress/integration/`.

### 3. Coding Standards & Conventions

- **BEM Styling**: Strictly adhere to the Block-Element-Modifier pattern (e.g., `.card`, `.card__title`, `.card--highlighted`). Avoid context-dependent nested selectors.
- **Icon Implementation**: Use the CSS `mask-image` pattern on `<span>` tags for icons. This allows for dynamic coloring via `background-color: currentColor`.
- **Accessibility**: All interactive elements must be keyboard accessible. Maintain **WCAG 2.1 AA** compliance. Typography must be at least **1rem (16px)**.
- **Documentation**: All classes and methods must include **DocBlock** comments detailing parameters and return types.
- **Build Process**: Increment the Build Number and update the GMT timestamp in the `index.html` footer before every push. This also refreshes static asset cache busters.

### 4. Technical Stack Summary

- **Engine**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS (Variables, Flexbox, Grid)
- **Persistence**: `localStorage` via State Proxy
- **Testing**: Node.js/JSDOM (Unit), Cypress (Integration/A11y)
- **API**: UK Land Registry SPARQL Endpoint

## 🚀 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/DrizzlyOwl/FairShare.git
   cd FairShare
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## 📖 Usage

### Running Locally
To start a local development server:
```sh
npm start
```
The application will be available at `http://localhost:8080`.

### Workflow
1. **Income**: Input annual gross or monthly net income. Ratios are calculated on **estimated net earnings** for maximum fairness. Supports one zero-income partner.
2. **Property**: Enter postcode and size; use "Estimate" for Land Registry market data.
3. **Mortgage**: Set your deposit (percentage or amount) and interest rates. Optionally add arrangement fees.
4. **Utilities**: Review regional estimates for Council Tax, Energy, and Water.
5. **Committed**: Add optional shared lifestyle costs (Groceries, Insurances, etc.).
6. **Results**: Review the comprehensive breakdown of both upfront cash and monthly budget.

### Running Tests
- **All Tests**: `npm test`
- **Unit Tests**: `npm run test:unit`
- **Integration Tests**: `npm run test:cypress`
- **Accessibility Audits**: `npm run test:a11y`
- **Cypress UI**: `npm run cypress:open`

## 🤝 Contribution

Contributions are welcome! Please follow these guidelines:
1. Ensure all changes adhere to the **BEM** naming convention for CSS.
2. Maintain **WCAG 2.1 AA** compliance (validated via Axe).
3. All text must maintain a minimum font size of **1rem (16px)**.
4. Document all new functions with **DocBlock** style comments.
5. Update or add tests for new features.
6. Increment the **Build Number** and **Datetime** in the footer before pushing.

## 📜 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) file for details.

---

Vibe coded by Ash Davies (DrizzlyOwl) and Gemini.
