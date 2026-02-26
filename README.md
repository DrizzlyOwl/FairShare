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

## 🛠️ Tech Stack

This application adheres to a "naked" but highly polished architectural philosophy:

- **Engine**: Vanilla JavaScript (ES6+) - Zero dependencies for maximum performance.
- **Styling**: Modern CSS (Variables, Flexbox, Grid) with BEM naming convention.
- **Components**: Polished, framework-less UI elements like animated toggles and segmented controls.
- **Testing**: Robust suite including Node.js (JSDOM) unit tests, Cypress integration tests, and Axe-core accessibility audits.
- **Storage**: `localStorage` for automatic progress persistence.

## 🏗️ Technical Architecture

FairShare is built using a **Decoupled Modular Design** powered by ES6 modules, ensuring high maintainability and testability without a framework.

### 1. Specialized Controllers
The application logic is decomposed into specialized controllers to separate concerns:
- **`NavigationController`**: Manages the screen-to-screen lifecycle, hash-based routing, and global keyboard navigation.
- **`FormController`**: Handles complex input life-cycles, real-time formatting, and screen-level validation.
- **`UIManager`**: Orchestrates view state transitions, progress tracking, and BEM-compliant DOM updates.

### 2. Core Logic & State
- **`State.js`**: A reactive state container using a **JS Proxy** to intercept changes. It automatically triggers UI renders and handles throttled persistence to `localStorage`.
- **`FinanceEngine.js`**: A pure functional engine for UK-specific financial calculations (Tax, NI, SDLT, Mortgages), completely isolated from the DOM.
- **`FinanceOrchestrator.js`**: Coordinates complex flows between the engine and the state, acting as a middle layer for business logic.

### 3. Service Layer
- **`ApiService.js`**: Manages external data fetching (UK Land Registry SPARQL) and regional heuristic lookups, decoupled from the UI.

### 4. Utility Patterns
- **Declarative Validation**: Centralized schema-based validation in `Validator.js`.
- **Functional Exports**: `Export.js` provides utility for generating and downloading dynamic CSV reports.
- **BEM Styling**: Strict adherence to the Block-Element-Modifier pattern for modular, collision-free CSS.

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
