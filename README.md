# FairShare - Fair Bill Splitting Calculator

**FairShare** is a modern, high-performance web utility designed to help couples determine a fair and proportionate way to split household expenses. By moving beyond the standard 50/50 split—which can be inequitable when salaries differ significantly—this tool calculates contributions based on each partner's relative earning power.

## 🌟 Project Overview

FairShare automates household budgeting by establishing a contribution ratio based on relative income. It ensures both partners retain a fair share of disposable income, removing financial friction. The application guides users through a 7-step process to estimate property values, regional running costs, and shared lifestyle expenses, resulting in a detailed proportionate split report.

### Key Features
- **Proportionate Splitting**: Calculates a fair contribution ratio based on individual pre-tax annual salaries.
- **Real-World Data Integration**: Fetches estimated market values via the UK Land Registry SPARQL endpoint.
- **Regional Utilities**: Adjusts estimates based on postcode prefixes and property size.
- **Night Mode**: Fully WCAG 2.1 AA compliant dark theme support.
- **Local Persistence**: Saves progress automatically to `localStorage`.
- **Export to CSV**: Download full reports for joint account setup.
- **PWA Ready**: Works offline and is installable.

## 🛠️ Tech Stack

This application adheres to a "naked" but highly polished architectural philosophy:

- **Engine**: Vanilla JavaScript (ES6+) - Zero dependencies for maximum performance.
- **Styling**: Modern CSS (Variables, Flexbox, Grid) with BEM naming convention.
- **Icons**: Custom SVG icons using the `mask-image` pattern for dynamic coloring.
- **Storage**: `localStorage` for session persistence.
- **Testing**: Node.js (JSDOM) for unit tests and Cypress for E2E integration tests.

## 🚀 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
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
1. **Income**: Input annual pre-tax salaries to set the base ratio.
2. **Property**: Enter postcode and size; use "Estimate" for market data.
3. **Mortgage**: Set deposit % and interest rates to calculate repayments and SDLT.
4. **Utilities**: Review regional estimates for Council Tax, Energy, and Water.
5. **Committed**: Add shared lifestyle costs (Groceries, Childcare, etc.).
6. **Results**: Review the breakdown and download the CSV report.

### Running Tests
- **Unit Tests**: `npm run test:unit`
- **E2E Tests (Headless)**: `npm run test:cypress`
- **Cypress UI**: `npm run cypress:open`

## 🤝 Contribution

Contributions are welcome! Please follow these guidelines:
1. Ensure all changes adhere to the **BEM** naming convention for CSS.
2. Maintain **WCAG 2.1 AA** compliance for any UI changes.
3. Update or add unit/integration tests for new features.
4. Keep the "naked" architecture by avoiding external frameworks or heavy libraries.

## 📜 License

This project is licensed under the **Apache License, Version 2.0**. See the [LICENSE](LICENSE) file for details.

---

Vibe coded by Ash Davies (DrizzlyOwl) and Gemini.
