# His&Hers - Fair Share Calculator

His&Hers is a modern, high-performance web utility designed to help couples determine a fair and proportionate way to split household expenses. By moving beyond the standard 50/50 split—which can be inequitable when salaries differ significantly—this tool calculates contributions based on each partner's relative earning power.

## Key Features

- **Proportionate Bill Splitting**: Automatically calculates a "Fair Share" ratio based on annual pre-tax salaries, ensuring both partners retain a similar proportion of their disposable income.
- **Smart Estimation Logic**:
  - **Property Valuation**: Integrates with the UK Land Registry SPARQL endpoint to fetch real-world price data by postcode.
  - **Regional Utilities**: Adjusts energy and water estimates based on postcode prefixes (e.g., Northern vs. Southern adjustments) and property size.
  - **Tax Bands**: Provides monthly estimates based on standard UK Council Tax bands (A-H).
- **Comprehensive Financial Planning**:
  - **Mortgage & Equity**: Calculates monthly repayments and breaks down initial deposit requirements.
  - **Flexible Rules**: Users can choose to split specific line items (like Council Tax or Groceries) either by the income ratio or exactly 50/50.
  - **Committed Spending**: Includes optional categories for childcare, insurance, and shared lifestyle costs.
- **Advanced Results & Export**:
  - **Visual Breakdown**: Dynamic ratio bars and summary cards for instant clarity.
  - **CSV Export**: Generate a portable `.csv` report of the full cost breakdown for household record-keeping.
- **Progressive Web App (PWA)**: Fully installable on mobile and desktop, works offline, and loads instantly via service worker caching.

## Technical Architecture

This application adheres to a "naked" but highly polished architectural philosophy:

- **Zero Dependencies**: Built with pure Semantic HTML5, CSS3, and Vanilla JavaScript. No frameworks (React/Vue), no CSS libraries (Bootstrap), and no external icon sets.
- **High-Performance CSS**: Refactored to use a modern class-based component system with CSS Variables for theme management, ensuring low specificity and easy maintainability.
- **Accessibility First**: Features a WCAG 2.0 AA compliant color palette (Navy/Teal pairing to avoid bias), "Skip to Content" keyboard navigation, heading anchors, and full screen-reader support.
- **Data Persistence**: Uses `localStorage` to save progress automatically, allowing users to return to their calculation at any time.
- **Automated CI/CD**: Integrated GitHub Actions workflow for automatic deployment to GitHub Pages.

## User Journey (7 Steps)

1.  **Welcome**: Introduction to fair splitting principles.
2.  **Income**: Establish the core contribution ratio.
3.  **Property Details**: Locate and specify the new home.
4.  **Mortgage & Equity**: Finalize financing and deposit shares.
5.  **Monthly Utilities**: Confirm non-negotiable running costs.
6.  **Committed Spending**: Detail shared lifestyle and lifestyle costs.
7.  **Results**: Review the final balanced budget and export data.

## Development

This project was "Vibe Coded" by **Ash Davies (DrizzlyOwl)** and **Gemini**.

### Local Setup

The application is entirely static. To run it locally:
1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. (Optional) For PWA features, serve the directory via a local web server (e.g., `npx serve .`).