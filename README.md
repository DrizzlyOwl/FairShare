# FairShare - Fair Bill Splitting Calculator

**FairShare** is a modern, high-performance web utility designed to help couples determine a fair and proportionate way to split household expenses. By moving beyond the standard 50/50 split—which can be inequitable when salaries differ significantly—this tool calculates contributions based on each partner's relative earning power.

## Key Features

- **Proportionate Splitting**: Calculates a fair contribution ratio based on individual pre-tax annual salaries.
- **Real-World Data Integration**: Fetches estimated market values for properties via the UK Land Registry SPARQL endpoint.
- **Regional Utilities**: Adjusts energy and water estimates based on postcode prefixes (e.g., Northern vs. Southern adjustments) and property size.
- **Comprehensive Cost Breakdown**: Includes Mortgage, Council Tax, Energy, Water, Broadband, Groceries, and other committed spending.
- **Buyer Status Support**: Accurately handles "Sole Property" vs "Additional Property" scenarios, including First Time Buyer (FTB) relief calculations where applicable.
- **Flexible Rules**: Users can choose to split specific line items (like Council Tax or Groceries) either by the income ratio or exactly 50/50.
- **Local Persistence**: Saves your progress automatically to `localStorage` so you can return to your calculation at any time.
- **Export to CSV**: Allows you to download your full "Fair Share" report for easy reference.
- **PWA Ready**: Works offline via a service worker and can be installed on your home screen.

## Technical Architecture

This application adheres to a "naked" but highly polished architectural philosophy:

- **Vanilla JS**: No frameworks (React/Vue/Angular) to ensure maximum speed and zero dependencies.
- **Modern CSS**: Uses CSS variables and Flexbox/Grid for a responsive, accessible UI without a CSS framework.
- **Progressive Enhancement**: Built as a PWA with a focus on core web vitals and accessibility (WCAG 2.1 compliance).
- **Automated Testing**: Comprehensive integration tests using Cypress.

## How to Use

1. **Enter Salaries**: Input your and your partner's pre-tax annual income.
2. **Property Details**: Provide the postcode and size of your new home.
3. **Mortgage & Equity**: Configure your deposit and interest rates.
4. **Utilities & Spending**: Review and refine the estimated monthly costs.
5. **Results**: View your custom Fair Share report and download the CSV breakdown.

---

Vibe coded by Ash Davies (DrizzlyOwl) and Gemini.
