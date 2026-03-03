/**
 * tests.js
 * Comprehensive unit test suite for FairShare core logic and UI components.
 * Designed to run in a JSDOM environment.
 */

const results = [];
function runTest(name, fn) {
    try {
        fn();
        results.push({ name, status: 'pass' });
        console.log(`✔ ${name}`);
    } catch (e) {
        results.push({ name, status: 'fail', error: e.message });
        console.log(`✖ ${name}\n${e.stack}`);
    }
}

// Mock Dependencies
window.formatCurrency = (val, dec = 0) => `£${val.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;

// --- START TESTS ---

runTest('calculateTieredTax should return 0 for £0 price', () => {
    const res = window.FinanceEngine.calculateTieredTax(0, [{ upto: 100, rate: 0.1 }]);
    console.assert(res === 0, 'Tax should be 0');
});

runTest('calculateTakeHome should handle England Basic Rate for £30k', () => {
    const res = window.FinanceEngine.calculateTakeHome(30000, 'EN');
    console.assert(Math.round(res.monthlyNet) === 2093, `Expected 2093, got ${Math.round(res.monthlyNet)}`);
});

runTest('calculateStampDuty should apply FTB relief for England', () => {
    const res = window.FinanceEngine.calculateStampDuty(400000, 'EN', 'first', true);
    console.assert(res === 5000, `Expected 5000, got ${res}`);
});

runTest('State should initialize with default data', () => {
    const state = new window.State();
    console.assert(state.data.beds === 2, 'Default beds should be 2');
    console.assert(state.data.baths === 1, 'Default baths should be 1');
});

runTest('State.update should handle bulk updates', () => {
    let count = 0;
    const state = new window.State(undefined, () => { count++; });
    state.update({ salaryP1: 40000, salaryP2: 60000 });
    console.assert(count === 1, 'Batch update should only trigger callback once');
});

runTest('ApiService.getRegionFromPostcode', () => {
    const res = window.ApiService.getRegionFromPostcode('EH1 1YZ');
    console.assert(res.code === 'SC', 'Should identify Scotland');
});

runTest('UIManager.updateRatioBar', () => {
    const barP1 = { style: {} };
    const ui = new window.UIManager({ barP1, ratioTextDesc: {} }, {});
    ui.updateRatioBar(0.6, 0.4);
    console.assert(barP1.style.width === '60%', 'Ratio bar P1 mismatch');
});

runTest('UIManager.renderResultsSummary', () => {
    const summaryText = { innerText: '' };
    const mockElements = {
        resultSummary: { querySelector: () => summaryText, removeAttribute: () => {} },
        resultP1: {}, resultP2: {}, totalBillDisplay: {},
        equityP1Display: {}, equityP2Display: {},
        upfrontTaxLabel: {}, breakdownSummary: { innerText: '' }
    };
    const ui = new window.UIManager(mockElements, {});
    const summary = {
        monthly: { p1: 1000, p2: 1000, total: 2000, costs: { mortgage: { total: 0 }, councilTax: { total: 0 }, energy: { total: 0 }, water: { total: 0 }, broadband: { total: 0 }, groceries: { total: 0 }, childcare: { total: 0 }, insurance: { total: 0 }, otherShared: { total: 0 } } },
        upfront: { p1: 5000, p2: 5000, total: 10000, sdlt: 0, legalFees: 0 }
    };
    const state = { depositSplitProportional: true, ratioP1: 0.5, ratioP2: 0.5, totalEquity: 5000, regionCode: 'EN' };
    
    ui.renderResultsSummary(summary, state);
    console.assert(summaryText.innerText === 'Both partners contribute equally.', 'Summary text mismatch');
});

runTest('UIManager.render updates input values', () => {
    const mockElements = {
        monthlyMortgageDisplay: { value: '' },
        totalRepaymentDisplay: { value: '' },
        depositPercentage: { value: '' },
        depositAmount: { value: '' }
    };
    const ui = new window.UIManager(mockElements, {});
    const state = {
        ratioP1: 0.5,
        ratioP2: 0.5,
        monthlyMortgagePayment: 1200,
        totalRepayment: 432000,
        depositPercentage: 10,
        depositAmount: 30000
    };
    
    ui.render(state);
    
    console.assert(mockElements.monthlyMortgageDisplay.value === '£1,200', `Monthly mortgage value mismatch: ${mockElements.monthlyMortgageDisplay.value}`);
    console.assert(mockElements.totalRepaymentDisplay.value === '£432,000', `Total repayment value mismatch: ${mockElements.totalRepaymentDisplay.value}`);
    console.assert(mockElements.depositPercentage.value === '10.0', `Deposit percentage value mismatch: ${mockElements.depositPercentage.value}`);
    console.assert(mockElements.depositAmount.value === 30000, `Deposit amount value mismatch: ${mockElements.depositAmount.value}`);
});

runTest('Validator.validateField', () => {
    console.assert(window.Validator.validateField('depositPercentage', 50) === true, 'Valid value failed');
    console.assert(window.Validator.validateField('depositPercentage', 150) === false, 'Invalid value passed');
});

runTest('CalculationEngine.getSummary', () => {
    const state = {
        propertyPrice: 300000, regionCode: 'EN', homeType: 'first', isFTB: false,
        totalEquity: 30000, ratioP1: 0.5, ratioP2: 0.5, monthlyMortgagePayment: 1500,
        splitTypes: {}, councilTaxCost: 0, energyCost: 0, waterBill: 0, broadbandCost: 0, 
        groceriesCost: 0, childcareCost: 0, insuranceCost: 0, otherSharedCosts: 0
    };
    const summary = window.CalculationEngine.getSummary(state);
    console.assert(summary.upfront.sdlt === 5000, `SDLT mismatch: ${summary.upfront.sdlt}`);
});

runTest('app instance existence', () => {
    console.assert(window.app !== undefined, 'Global app instance should exist');
    console.assert(typeof window.app.init === 'function', 'app.init should be a function');
});

// Report results to CLI if running in Node
if (typeof module !== 'undefined' && module.exports) {
    const failCount = results.filter(r => r.status === 'fail').length;
    if (failCount > 0) process.exit(1);
    else process.exit(0);
}
