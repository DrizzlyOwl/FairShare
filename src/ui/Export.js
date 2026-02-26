/**
 * Export.js
 * Functional utilities for data export and reporting.
 */

export default class CSV {
    /**
     * Generates and triggers a browser download of a CSV report.
     * @param {Object} state - The current application state.
     * @param {HTMLTableElement} table - The results table element for breakdown data.
     */
    static download(state, table) {
        if (!table) {
            console.error('CSV Export: Missing table reference.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "FairShare Bill Splitting Report\n";
        csvContent += `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}\n\n`;

        const salaryLabel = state.salaryType === 'gross' ? 'Annual Salary (Pre-tax)' : 'Monthly Net Pay';
        csvContent += "1. INCOME RATIO WORKINGS\n";
        csvContent += `Your ${salaryLabel},${state.salaryP1}\n`;
        csvContent += `Partner ${salaryLabel},${state.salaryP2}\n`;
        csvContent += `Your Share %,${(state.ratioP1 * 100).toFixed(1)}%\n`;
        csvContent += `Partner Share %,${(state.ratioP2 * 100).toFixed(1)}%\n\n`;

        csvContent += "2. MORTGAGE & EQUITY\n";
        csvContent += `Property Value,${state.propertyPrice}\n`;
        csvContent += `Deposit %,${state.depositPercentage}%\n`;
        csvContent += `Monthly Payment,${state.monthlyMortgagePayment.toFixed(2)}\n\n`;

        csvContent += "3. FULL COST BREAKDOWN\n";
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('th, td');
            const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/[£,]/g, '')}"`);
            csvContent += rowData.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fairshare_report_${new Date().toISOString().slice(0, 10)}.csv`);
        
        // Temporarily append to body to ensure it works across all browsers
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
