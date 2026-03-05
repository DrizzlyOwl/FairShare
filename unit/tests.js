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

runTest('calculateTakeHome should deduct pension pre-tax', () => {
    // £30k with 10% pension (£3k) -> £27k taxable
    // Tax on £27k: (£27,000 - £12,570) * 0.2 = £2,886
    // NI on £30k (NI is on gross): (£30,000 - £12,570) * 0.08 = £1,394.4
    // Net: (£30,000 - £2,886 - £1,394.4 - £3,000) / 12 = £1,893.3
    const res = window.FinanceEngine.calculateTakeHome(30000, 'EN', 10);
    console.assert(Math.round(res.monthlyNet) === 1893, `Expected 1893, got ${Math.round(res.monthlyNet)}`);
});

runTest('calculateTakeHome should deduct Student Loan Plan 1', () => {
    // £30k, Plan 1 threshold: £26,065. 9% of (£30,000 - £26,065) = £354.15
    // Monthly net should be approx £29.5 less than standard
    const resStandard = window.FinanceEngine.calculateTakeHome(30000, 'EN');
    const resLoan = window.FinanceEngine.calculateTakeHome(30000, 'EN', 0, 'plan1');
    const diff = resStandard.monthlyNet - resLoan.monthlyNet;
    console.assert(Math.round(diff) === Math.round(354.15 / 12), `Expected ~£30 loan deduction, got ${Math.round(diff)}`);
});

runTest('calculateTakeHome should deduct Student Loan Plan 2', () => {
    // £35k, Plan 2 threshold: £27,295. 9% of (£35,000 - £27,295) = £693.45
    const resStandard = window.FinanceEngine.calculateTakeHome(35000, 'EN');
    const resLoan = window.FinanceEngine.calculateTakeHome(35000, 'EN', 0, 'plan2');
    const diff = resStandard.monthlyNet - resLoan.monthlyNet;
    console.assert(Math.round(diff) === Math.round(693.45 / 12), `Expected ~£58 loan deduction, got ${Math.round(diff)}`);
});

runTest('calculateTakeHome should deduct Postgraduate Loan', () => {
    // £30k, PG threshold: £21,000. 6% of (£30,000 - £21,000) = £540
    const resStandard = window.FinanceEngine.calculateTakeHome(30000, 'EN');
    const resLoan = window.FinanceEngine.calculateTakeHome(30000, 'EN', 0, 'postgrad');
    const diff = resStandard.monthlyNet - resLoan.monthlyNet;
    console.assert(Math.round(diff) === Math.round(540 / 12), `Expected £45 loan deduction, got ${Math.round(diff)}`);
});

runTest('calculateStampDuty should apply FTB relief for England', () => {
    const res = window.FinanceEngine.calculateStampDuty(400000, 'EN', 'first', true);
    console.assert(res === 5000, `Expected 5000, got ${res}`);
});

runTest('Logger should format and log messages', () => {
    class TestModule extends window.Logger {
        constructor() { super('TestTag'); }
        testLog() { this.info('Hello Info'); }
        testDebug() { this.debug('Hello Debug'); }
    }
    
    const logger = new TestModule();
    let lastLog = '';
    const originalInfo = console.info;
    console.info = (msg) => { lastLog = msg; };
    
    logger.testLog();
    console.info = originalInfo;
    
    console.assert(lastLog === '[INFO] [TestTag] Hello Info', `Expected "[INFO] [TestTag] Hello Info", got "${lastLog}"`);
    
    // Test debug with flag
    const originalDebug = console.debug;
    let debugCalled = false;
    console.debug = () => { debugCalled = true; };
    
    window.DEBUG = true;
    logger.testDebug();
    console.assert(debugCalled === true, 'Debug should be called when window.DEBUG is true');
    
    debugCalled = false;
    window.DEBUG = false;
    logger.testDebug();
    console.assert(debugCalled === false, 'Debug should NOT be called when window.DEBUG is false');
    
    console.debug = originalDebug;
});

runTest('State should initialize with default data', () => {
    const state = new window.State();
    console.assert(state.data.version === 1, 'Default version should be 1');
    console.assert(state.data.beds === 2, 'Default beds should be 2');
    console.assert(state.data.baths === 1, 'Default baths should be 1');
});

runTest('State should support reactive computed properties', () => {
    const definitions = {
        total: (data) => data.a + data.b
    };
    const state = new window.State({ a: 1, b: 2 }, null, null, definitions);
    
    console.assert(state.data.total === 3, `Initial computed mismatch: ${state.data.total}`);
    
    state.update({ a: 10 });
    console.assert(state.data.total === 12, `Updated computed mismatch: ${state.data.total}`);
});

runTest('monthlySummary computed should return structured monthly costs', () => {
    const orchestrator = new window.FinanceOrchestrator();
    const definitions = {
        monthlySummary: (data) => orchestrator.getFinalSummary(data).monthly
    };
    const state = new window.State({
        propertyPrice: 300000, regionCode: 'EN', homeType: 'first', isFTB: false,
        totalEquity: 30000, ratioP1: 0.5, ratioP2: 0.5, monthlyMortgagePayment: 1000,
        splitTypes: {}, councilTaxCost: 200, energyCost: 100, waterBill: 50, broadbandCost: 50, 
        groceriesCost: 400, childcareCost: 0, insuranceCost: 0, otherSharedCosts: 0
    }, null, null, definitions);

    const summary = state.data.monthlySummary;
    console.assert(summary.total === 1800, `Total monthly mismatch: ${summary.total}`);
    console.assert(summary.p1 === 900, `P1 share mismatch: ${summary.p1}`);
    console.assert(summary.p2 === 900, `P2 share mismatch: ${summary.p2}`);
});

runTest('State should prevent setting computed properties', () => {
    const definitions = { total: (data) => data.a + data.b };
    const state = new window.State({ a: 1, b: 2 }, null, null, definitions);
    
    state.data.total = 100; // This should trigger an error in console but return the value in JS Proxy (the handler returns false)
    console.assert(state.data.total === 3, 'Computed property should remain read-only');
});

runTest('State should migrate from v0 (unversioned) to v1', () => {
    localStorage.clear();
    const oldState = { salaryP1: 50000, salaryP2: 60000 }; // No version
    localStorage.setItem('fairshare_cache', JSON.stringify(oldState));
    
    const state = new window.State();
    state.hydrate();
    
    console.assert(state.data.version === 1, `Expected version 1, got ${state.data.version}`);
    console.assert(state.data.salaryP1 === 50000, 'SalaryP1 should be preserved');
    console.assert(state.data.salaryP2 === 60000, 'SalaryP2 should be preserved');
    console.assert(state.data.beds === 2, 'Default values from INITIAL_STATE should be populated');
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

runTest('UIManager.updatePieChart', () => {
    const legendP1Perc = { innerText: '' };
    const pieCenterText = { textContent: '' };
    const ui = new window.UIManager({ legendP1Perc, pieCenterText, ratioTextDesc: {} }, {});
    ui.updatePieChart(0.6, 0.4);
    console.assert(legendP1Perc.innerText === '60%', 'Legend P1 mismatch');
    console.assert(pieCenterText.textContent === '60/40', 'Pie center text mismatch');
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
    
    console.assert(mockElements.monthlyMortgageDisplay.value === '1,200', `Monthly mortgage value mismatch: ${mockElements.monthlyMortgageDisplay.value}`);
    console.assert(mockElements.totalRepaymentDisplay.value === '432,000', `Total repayment value mismatch: ${mockElements.totalRepaymentDisplay.value}`);
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
    const orchestrator = new window.FinanceOrchestrator();
    const summary = orchestrator.getFinalSummary(state);
    console.assert(summary.upfront.sdlt === 5000, `SDLT mismatch: ${summary.upfront.sdlt}`);
});

runTest('calculateTakeHome should taper personal allowance > £100k', () => {
    // £125,140 salary should have £0 personal allowance
    const res = window.FinanceEngine.calculateTakeHome(125140, 'EN');
    // Result: 6719
    console.assert(Math.round(res.monthlyNet) === 6719, `Expected 6719, got ${Math.round(res.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scotland tax bands', () => {
    const res = window.FinanceEngine.calculateTakeHome(50000, 'SC');
    console.assert(res.bandName.includes('Intermediate') || res.bandName.includes('Higher'), `Expected Scottish band, got ${res.bandName}`);
});

runTest('calculateStampDuty should apply additional surcharge for second homes', () => {
    const resStandard = window.FinanceEngine.calculateStampDuty(300000, 'EN', 'first', false);
    const resAdditional = window.FinanceEngine.calculateStampDuty(300000, 'EN', 'second', false);
    console.assert(resAdditional > resStandard, 'Second home tax should be higher');
});

runTest('calculateStampDuty should handle Wales (LTT)', () => {
    const res = window.FinanceEngine.calculateStampDuty(250000, 'WA', 'first', false);
    console.assert(res > 0, 'Should calculate LTT for Wales');
});

runTest('calculateMortgage should return 0 for invalid inputs', () => {
    const res = window.FinanceEngine.calculateMortgage(0, 5, 25);
    console.assert(res.monthlyPayment === 0, 'Payment should be 0');
});

runTest('Validator.validateScreen should catch invalid mortgage data', () => {
    const data = { depositType: 'percentage', depositPercentage: 150, mortgageInterestRate: 5, mortgageTerm: 25 };
    const res = window.Validator.validateScreen('screen-4', data);
    console.assert(res.isValid === false, 'Should be invalid');
    console.assert(res.errors.includes('depositPercentage'), 'Should identify deposit error');
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
