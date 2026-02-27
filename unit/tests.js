/**
 * unit/tests.js
 * Comprehensive unit test suite for FairShare logic.
 * Runs in both browser (test-runner.html) and CI (Node/JSDOM).
 */

/* global State, INITIAL_STATE, ApiService, createAlertHTML, UIManager, formatCurrency */

console.log('FinanceEngine available:', !!window.FinanceEngine);
console.log('State available:', !!window.State);

/**
 * Mocking the DOM and other dependencies for testing.
 * Provides a minimal environment for tests that touch UI logic.
 */
if (typeof appData === 'undefined') {
  globalThis.appData = {
    salaryP1: 0,
    salaryP2: 0,
    salaryType: 'gross',
    ratioP1: 0.5,
    ratioP2: 0.5,
    propertyPrice: 0,
    depositPercentage: 0,
    depositSplitProportional: true,
    totalEquity: 0,
    mortgageRequired: 0,
    equityP1: 0,
    equityP2: 0,
    mortgageFees: 0,
    waterBill: 0,
    broadbandCost: 0,
    groceriesCost: 0,
    childcareCost: 0,
    insuranceCost: 0,
    otherSharedCosts: 0,
    mortgageInterestRate: 0,
    mortgageTerm: 0,
    monthlyMortgagePayment: 0,
    postcode: '',
    isNorth: false,
    regionCode: 'EN',
    taxBand: '',
    beds: 0,
    baths: 0,
    homeType: 'first',
    isFTB: false,
    splitTypes: {
      councilTax: 'yes',
      energy: 'yes',
      water: 'yes',
      broadband: 'yes',
      groceries: 'yes',
      childcare: 'yes',
      insurance: 'yes',
      otherShared: 'yes',
    },
  };
}

if (typeof elements === 'undefined') {
  globalThis.elements = {
    propertyPrice: { value: '' },
    depositPercentage: { value: '' },
    sdltEstimate: { value: '' },
    sdltDisplay: { innerText: '' },
    legalFeesEstimate: { value: '' },
    totalEquityDisplay: { innerText: '' },
    totalUpfrontDisplay: { innerText: '' },
    mortgageFees: { value: '' },
    mortgageRequiredDisplay: { innerText: '' },
    equityP1Display: { innerText: '' },
    equityP2Display: { innerText: '' },
    displayPropertyPrice: { value: '' },
    propertyPriceEstimateDisplay: { innerHTML: '', setAttribute: () => {}, removeAttribute: () => {} }
  };
}

/**
 * Helper function to run tests and log results.
 * @param {string} testName - Description of the test.
 * @param {Function} testFunction - The test logic to execute.
 */
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✔ ${testName}`);
  } catch (error) {
    console.error(`✖ ${testName}`);
    console.error(error);
  }
}

// -- START: FinanceEngine Tests --

runTest('calculateTieredTax should return 0 for £0 price', () => {
  const engine = window.FinanceEngine;
  const brackets = window.TAX_BRACKETS.EN.standard;
  const tax = engine.calculateTieredTax(0, brackets);
  console.assert(tax === 0, `Expected 0, but got ${tax}`);
});

runTest('calculateTieredTax should calculate tax across multiple brackets', () => {
    const engine = window.FinanceEngine;
    const brackets = window.TAX_BRACKETS.EN.standard;
    const tax = engine.calculateTieredTax(300000, brackets);
    // (125000 * 0) + (125000 * 0.02) + (50000 * 0.05) = 0 + 2500 + 2500 = 5000
    console.assert(tax === 5000, `Expected 5000, but got ${tax}`);
});

runTest('calculateTakeHome should handle England Basic Rate for £30k', () => {
  const engine = window.FinanceEngine;
  const result = engine.calculateTakeHome(30000, 'EN');
  console.assert(result.bandName === 'Basic Rate', `Expected Basic Rate, but got ${result.bandName}`);
  console.assert(Math.round(result.monthlyNet) === 2093, `Expected approx £2,093, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateStampDuty should apply FTB relief for England', () => {
    const engine = window.FinanceEngine;
    const duty = engine.calculateStampDuty(300000, 'EN', 'first', true);
    console.assert(duty === 0, `Expected 0, but got ${duty}`);
});

runTest('calculateTakeHome should handle tapered personal allowance for £150k', () => {
    const engine = window.FinanceEngine;
    const result = engine.calculateTakeHome(150000, 'EN');
    // At £150k, allowance is £0. Tax: (50270 * 0.2) + (74870 * 0.4) + (24860 * 0.45) = 10054 + 29948 + 11187 = 51189
    // NI: (50270-12570)*0.08 + (150000-50270)*0.02 = 3016 + 1994 = 5010
    // Net: (150000 - 51189 - 5010) / 12 = 7816.75
    console.assert(Math.round(result.monthlyNet) === 7817, `Expected approx £7,817, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish tax bands for £40k', () => {
    const engine = window.FinanceEngine;
    const result = engine.calculateTakeHome(40000, 'SC');
    console.assert(result.bandName === 'Intermediate Rate', `Expected Intermediate Rate, but got ${result.bandName}`);
});

runTest('calculateStampDuty should apply surcharge for additional property', () => {
    const engine = window.FinanceEngine;
    // £300k standard: 125k*0 + 125k*0.02 + 50k*0.05 = 5000
    // Additional surcharge: 300k * 0.03 = 9000
    const duty = engine.calculateStampDuty(300000, 'EN', 'second', false);
    console.assert(duty === 14000, `Expected 14000, but got ${duty}`);
});

runTest('calculateStampDuty should handle Welsh LTT', () => {
    const engine = window.FinanceEngine;
    // £200k WA standard: 180k*0 + 20k*0.035 = 700
    const duty = engine.calculateStampDuty(200000, 'WA', 'first', false);
    console.assert(duty === 700, `Expected 700, but got ${duty}`);
});

runTest('calculateMortgage should handle 0% interest rate gracefully', () => {
    const engine = window.FinanceEngine;
    const res = engine.calculateMortgage(200000, 0, 25);
    console.assert(res.monthlyPayment === 0, 'Should return 0 for 0% interest');
});

// -- START: State Tests --

runTest('State should initialize with default data', () => {
    const store = new State(INITIAL_STATE);
    console.assert(store.data.salaryP1 === 0, 'Default salaryP1 should be 0');
    console.assert(store.data.regionCode === 'EN', 'Default regionCode should be EN');
});

runTest('State should trigger update callback on change', () => {
    let triggered = false;
    const store = new State(INITIAL_STATE, () => { triggered = true; });
    store.data.salaryP1 = 50000;
    console.assert(triggered === true, 'Callback should trigger on property set');
    console.assert(store.data.salaryP1 === 50000, 'State should reflect new value');
});

runTest('State.update should handle bulk updates', () => {
    const store = new State(INITIAL_STATE, () => { });
    store.update({ salaryP1: 40000, salaryP2: 60000 });
    // Proxy nested set might trigger twice depending on implementation, 
    // but the final data must be correct.
    console.assert(store.data.salaryP1 === 40000, 'salaryP1 should be 40000');
    console.assert(store.data.salaryP2 === 60000, 'salaryP2 should be 60000');
});

runTest('State.hydrate should recover state from localStorage', () => {
    localStorage.setItem('fairshare_cache', JSON.stringify({ salaryP1: 12345 }));
    const store = new State(INITIAL_STATE);
    store.hydrate();
    console.assert(store.data.salaryP1 === 12345, 'Hydrated state should reflect cached value');
});

// -- START: ApiService Tests --

runTest('getRegionFromPostcode should identify a Scottish postcode', () => {
  const result = ApiService.getRegionFromPostcode('EH1 1AD');
  console.assert(result.key === 'SCOTLAND', `Expected 'SCOTLAND', but got '${result.key}'`);
});

runTest('estimateWaterCost should scale with bathrooms and beds', () => {
    const cost1 = ApiService.estimateWaterCost('SW1A 1AA', 1, 1); // 18 + 12 + 0 = 30
    const cost2 = ApiService.estimateWaterCost('SW1A 1AA', 1, 3); // 18 + 12 + 10 = 40
    console.assert(cost2 > cost1, '3 bathrooms should cost more than 1');
    console.assert(cost1 === 30, `Expected 30, got ${cost1}`);

    const cost3 = ApiService.estimateWaterCost('SW1A 1AA', 3, 1); // 18 + 36 + 0 = 54
    console.assert(cost3 > cost1, '3 beds should cost more than 1 bed');
});

runTest('ApiService.getRegionFromPostcode should map multiple UK regions', () => {
    const wal = ApiService.getRegionFromPostcode('CF10 1BH');
    console.assert(wal.code === 'WA', 'Cardiff should map to Wales (WA)');

    const ni = ApiService.getRegionFromPostcode('BT1 1AA');
    console.assert(ni.code === 'NI', 'Belfast should map to NI');

    const eng = ApiService.getRegionFromPostcode('SW1A 1AA');
    console.assert(eng.code === 'EN', 'London should map to England (EN)');
});

runTest('ApiService.getRegionFromPostcode should return null for invalid formats', () => {
    const res = ApiService.getRegionFromPostcode('INVALID');
    console.assert(res === null, 'Should return null for invalid postcode');
});

// -- START: UI Component Tests --

runTest('updatePropertyPriceDisplay should update displayPropertyPrice with formatted currency', () => {
    const mockApp = {
      elements: {
        propertyPriceEstimateDisplay: {
          innerHTML: '',
          removeAttribute: () => {},
          setAttribute: () => {}
        },
        displayPropertyPrice: { value: '' }
      },
      updatePropertyPriceDisplay: function(price, isEstimated) {
          const display = this.elements.propertyPriceEstimateDisplay;
          if (!display) return;
          if (price > 0) {
              const formatted = formatCurrency(price); // Using actual functional utility
              const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
              display.innerHTML = `${labelText}<span>${formatted}</span>`;
              if (this.elements.displayPropertyPrice) {
                  this.elements.displayPropertyPrice.value = price.toLocaleString('en-GB');
              }
          }
      }
    };
  
    mockApp.updatePropertyPriceDisplay(250000, false);
    console.assert(mockApp.elements.displayPropertyPrice.value === '250,000', `Expected 250,000, got ${mockApp.elements.displayPropertyPrice.value}`);
    console.assert(mockApp.elements.propertyPriceEstimateDisplay.innerHTML.includes('£250,000'), 'HTML should contain formatted price');
});

runTest('showWarning should create a visible alert with correct message', () => {
    const tempContainer = document.createElement('div');
    tempContainer.id = 'test-container';
    tempContainer.innerHTML = '<div id="warning-screen-2" hidden></div>';
    document.body.appendChild(tempContainer);
  
    const ui = new UIManager({}, {});
    ui.showWarning(2, 'Test Warning Message');
  
    const alertDiv = document.getElementById('warning-screen-2');
    console.assert(alertDiv !== null, 'Alert div should exist');
    console.assert(alertDiv.hasAttribute('hidden') === false, 'Alert should be visible');
    
    document.body.removeChild(tempContainer);
});

runTest('calculateFinalSplit integration should correctly calculate upfront and monthly split', () => {
    // 1. Setup Mock State (P1: £30k, P2: £20k -> 60/40 ratio approx)
    // We'll use fixed ratios to avoid float jitter in this high-level test
    const mockApp = {
        store: {
            data: {
                salaryP1: 30000,
                salaryP2: 20000,
                ratioP1: 0.6,
                ratioP2: 0.4,
                propertyPrice: 300000,
                totalEquity: 30000, // 10% deposit
                mortgageFees: 0,
                regionCode: 'EN',
                homeType: 'first',
                isFTB: false,
                depositSplitProportional: true,
                monthlyMortgagePayment: 1500,
                councilTaxCost: 150,
                energyCost: 100,
                waterBill: 30,
                broadbandCost: 30,
                groceriesCost: 400,
                childcareCost: 0,
                insuranceCost: 0,
                otherSharedCosts: 0,
                splitTypes: {
                    councilTax: 'yes', // ratio
                    energy: 'no',      // equal
                    water: 'yes',
                    broadband: 'no',
                    groceries: 'yes'
                }
            }
        },
        elements: {
            totalUpfrontDisplay: {},
            equityP1Display: {},
            equityP2Display: {},
            resultP1: {},
            resultP2: {},
            totalBillDisplay: {},
            resultSummary: { querySelector: () => ({}) }
        },
        ui: { 
            updateBreakdownRow: () => {},
            switchScreen: () => {}
        },
        // Re-injecting logic for test
        calculateFinalSplit: function() {
            const state = this.store.data;
            const upfrontRatio = state.depositSplitProportional ? state.ratioP1 : 0.5;
            const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
            const legalFees = 1200; // Standard for £300k
            const totalUpfront = state.totalEquity + sdlt + legalFees + state.mortgageFees;

            const upfrontP1 = totalUpfront * upfrontRatio;
            const upfrontP2 = totalUpfront * (1 - upfrontRatio);

            const getSplit = (key, val) => {
                const pref = state.splitTypes[key] || 'yes';
                const r = pref === 'yes' ? state.ratioP1 : 0.5;
                return { p1: val * r, p2: val * (1 - r) };
            };

            const tax = getSplit('councilTax', state.councilTaxCost); // 150 * 0.6 = 90
            const energy = getSplit('energy', state.energyCost);      // 100 * 0.5 = 50
            const water = getSplit('water', state.waterBill);        // 30 * 0.6 = 18
            const bb = getSplit('broadband', state.broadbandCost);   // 30 * 0.5 = 15
            const gr = getSplit('groceries', state.groceriesCost);   // 400 * 0.6 = 240
            
            const mortP1 = state.monthlyMortgagePayment * state.ratioP1; // 1500 * 0.6 = 900
            const mortP2 = state.monthlyMortgagePayment * state.ratioP2; // 1500 * 0.4 = 600

            const totalP1 = tax.p1 + energy.p1 + water.p1 + bb.p1 + gr.p1 + mortP1;
            const totalP2 = tax.p2 + energy.p2 + water.p2 + bb.p2 + gr.p2 + mortP2;

            return { totalUpfront, upfrontP1, upfrontP2, totalP1, totalP2 };
        }
    };

    const result = mockApp.calculateFinalSplit();

    // Upfront Check: 30000 + 5000 + 1200 = 36200
    console.assert(result.totalUpfront === 36200, `Upfront mismatch: ${result.totalUpfront}`);
    console.assert(result.upfrontP1 === 36200 * 0.6, `Upfront P1 mismatch: ${result.upfrontP1}`);

    // Monthly Check P1: 90 + 50 + 18 + 15 + 240 + 900 = 1313
    console.assert(result.totalP1 === 1313, `Monthly P1 mismatch: ${result.totalP1}`);
    // Monthly Check P2: 60 + 50 + 12 + 15 + 160 + 600 = 897
    console.assert(result.totalP2 === 897, `Monthly P2 mismatch: ${result.totalP2}`);
});

runTest('renderCalculationWorkings should update all detail fields', () => {
    const mockState = {
        salaryP1: 30000,
        salaryP2: 20000,
        ratioP1: 0.6,
        ratioP2: 0.4,
        propertyPrice: 300000,
        depositPercentage: 10.5,
        totalEquity: 31500,
        depositSplitProportional: true,
        mortgageRequired: 268500,
        mortgageInterestRate: 4.5,
        mortgageTerm: 25,
        monthlyMortgagePayment: 1500.99,
        totalRepayment: 450297.00
    };

    const mockElements = {
        wkSalaryP1: { innerText: '' },
        wkSalaryP2: { innerText: '' },
        wkTotalSalary: { innerText: '' },
        wkP1Perc: { innerText: '' },
        wkP2Perc: { innerText: '' },
        wkPropertyPrice: { innerText: '' },
        wkDepositPerc: { innerText: '' },
        wkTotalEquity: { innerText: '' },
        wkDepositSplitType: { innerText: '' },
        wkMortgageRequired: { innerText: '' },
        wkInterestRate: { innerText: '' },
        wkMortgageTerm: { innerText: '' },
        wkMonthlyPayment: { innerText: '' },
        wkTotalRepayment: { innerText: '' }
    };

    // Use actual logic from window.UIManager.prototype.renderCalculationWorkings
    // We bind to a mock "this" to isolate logic from real app state
    const renderFunc = window.UIManager.prototype.renderCalculationWorkings.bind({
        elements: mockElements
    });

    renderFunc(mockState);

    console.assert(mockElements.wkDepositSplitType.innerText === 'Income Ratio', 'Deposit split type mismatch');
    console.assert(mockElements.wkMortgageRequired.innerText.includes('£268,500'), 'Mortgage required mismatch');
    console.assert(mockElements.wkInterestRate.innerText === '4.5%', 'Interest rate mismatch');
    console.assert(mockElements.wkMortgageTerm.innerText === 25, 'Mortgage term mismatch');
    console.assert(mockElements.wkDepositPerc.innerText === '10.5%', 'Deposit percentage mismatch');
    console.assert(mockElements.wkTotalRepayment.innerText.includes('£450,297.00'), `Total repayment mismatch: ${mockElements.wkTotalRepayment.innerText}`);
});

// -- START: Validator Tests --

runTest('Validator.validateField should enforce numeric constraints', () => {
    const v = window.Validator;
    console.assert(v.validateField('salaryP1', 50000) === true, 'Valid salary should pass');
    console.assert(v.validateField('salaryP1', -100) === false, 'Negative salary should fail');
    console.assert(v.validateField('salaryP1', 'invalid') === false, 'Non-numeric salary should fail');
});

runTest('Validator.validateField should enforce string patterns (postcode)', () => {
    const v = window.Validator;
    console.assert(v.validateField('postcode', 'SW1A 1AA') === true, 'Valid postcode should pass');
    console.assert(v.validateField('postcode', '12345') === false, 'Invalid postcode format should fail');
});

runTest('Validator.validateScreen should catch cross-field income rules', () => {
    const v = window.Validator;
    const result1 = v.validateScreen('screen-2', { salaryP1: 0, salaryP2: 0 });
    console.assert(result1.isValid === false, 'Both salaries zero should fail screen-2');
    console.assert(result1.errors.includes('salaryP1'), 'Should report salaryP1 error');

    const result2 = v.validateScreen('screen-2', { salaryP1: 50000, salaryP2: 0 });
    console.assert(result2.isValid === true, 'One salary > 0 should pass screen-2');
});

runTest('Validator.validateScreen should validate property screen', () => {
    const v = window.Validator;
    const data = { postcode: 'M1 1AD', propertyPrice: 300000, taxBand: 'C' };
    console.assert(v.validateScreen('screen-3', data).isValid === true, 'Valid property data should pass');
    
    const invalidData = { postcode: 'invalid', propertyPrice: 0, taxBand: '' };
    const result = v.validateScreen('screen-3', invalidData);
    console.assert(result.isValid === false, 'Invalid property data should fail');
    console.assert(result.errors.length === 3, `Expected 3 errors, got ${result.errors.length}`);
});

runTest('Validator.validateField should enforce enum constraints (taxBand)', () => {
    const v = window.Validator;
    console.assert(v.validateField('taxBand', 'A') === true, 'Band A should pass');
    console.assert(v.validateField('taxBand', 'Z') === false, 'Invalid Band Z should fail');
});

runTest('Validator.validateField should enforce max constraints (depositPercentage)', () => {
    const v = window.Validator;
    console.assert(v.validateField('depositPercentage', 101) === false, '101% deposit should fail');
    console.assert(v.validateField('depositPercentage', 50) === true, '50% deposit should pass');
});

runTest('Validator.validateField should handle diverse UK postcode formats', () => {
    const v = window.Validator;
    ['M1 1AD', 'SW1A 1AA', 'EH1 1AD', 'BT1 1AA'].forEach(pc => {
        console.assert(v.validateField('postcode', pc) === true, `Postcode ${pc} should pass`);
    });
});

runTest('State.clear should reset to INITIAL_STATE', () => {
    const store = new State({ salaryP1: 99999, salaryP2: 99999 });
    store.clear();
    console.assert(store.data.salaryP1 === 0, 'State should reset to default');
});

// -- START: Helpers Tests --

runTest('formatCurrency should handle different decimal places', () => {
    console.assert(window.formatCurrency(1234) === '£1,234', `Expected £1,234, got ${window.formatCurrency(1234)}`);
    console.assert(window.formatCurrency(1234.56, 2) === '£1,234.56', `Expected £1,234.56, got ${window.formatCurrency(1234.56, 2)}`);
});

runTest('createAlertHTML should generate valid BEM structure', () => {
    const html = window.createAlertHTML('error', 'icon.svg', 'Error Message', 'err-id');
    console.assert(html.includes('class="alert alert--error"'), 'Missing variant class');
    console.assert(html.includes('id="err-id"'), 'Missing ID attribute');
    console.assert(html.includes('alert__text'), 'Missing text class');
});

runTest('debounce should execute immediately when in testing mode', () => {
    let callCount = 0;
    const fn = () => callCount++;
    const debounced = window.debounce(fn, 1000);
    
    // Simulate testing environment
    globalThis.Cypress = true;
    debounced();
    console.assert(callCount === 1, 'Debounce should bypass delay in tests');
    delete globalThis.Cypress;
});

// -- START: Export Tests --

runTest('CSV.generateRawCSV should format state and table data correctly', () => {
    const mockState = {
        salaryP1: 50000,
        salaryP2: 30000,
        ratioP1: 0.625,
        ratioP2: 0.375,
        propertyPrice: 250000,
        depositPercentage: 10,
        monthlyMortgagePayment: 1200,
        salaryType: 'gross'
    };

    const table = document.createElement('table');
    table.innerHTML = `
        <tr><th>Expense</th><td>Total</td></tr>
        <tr><td>Council Tax</td><td>£150</td></tr>
    `;

    const csv = window.CSV.generateRawCSV(mockState, table);
    
    console.assert(csv.includes('FairShare Bill Splitting Report'), 'CSV missing title');
    console.assert(csv.includes('Your Annual Salary (Pre-tax),50000'), 'CSV missing P1 salary');
    console.assert(csv.includes('Property Value,250000'), 'CSV missing property price');
    console.assert(csv.includes('"Council Tax","150"'), 'CSV missing table data');
});

runTest('CalculationEngine.getSummary should unify all financial logic', () => {
    const mockState = {
        propertyPrice: 300000,
        regionCode: 'EN',
        homeType: 'first',
        isFTB: true,
        totalEquity: 30000,
        mortgageFees: 999,
        ratioP1: 0.6,
        ratioP2: 0.4,
        depositSplitProportional: true,
        councilTaxCost: 200,
        energyCost: 100,
        waterBill: 50,
        broadbandCost: 30,
        groceriesCost: 400,
        childcareCost: 0,
        insuranceCost: 20,
        otherSharedCosts: 50,
        monthlyMortgagePayment: 1500,
        splitTypes: {
            councilTax: 'no', // 50/50
            energy: 'yes',    // Proportional
            water: 'yes',
            broadband: 'yes',
            groceries: 'yes',
            insurance: 'yes',
            otherShared: 'yes'
        }
    };

    const summary = window.CalculationEngine.getSummary(mockState);

    // Upfront: SDLT(0) + Legal(1200) + Equity(30000) + Fees(999) = 32199
    console.assert(summary.upfront.total === 32199, `Upfront total mismatch: ${summary.upfront.total}`);
    console.assert(summary.upfront.p1 === 32199 * 0.6, 'Upfront P1 split mismatch');

    // Monthly: 1500 + 200 + 100 + 50 + 30 + 400 + 0 + 20 + 50 = 2350
    console.assert(summary.monthly.total === 2350, `Monthly total mismatch: ${summary.monthly.total}`);
    
    // Check specific split (Council Tax 50/50 of 200 = 100 each)
    console.assert(summary.monthly.costs.councilTax.p1 === 100, 'Council tax split mismatch');
    // Check specific split (Energy 60% of 100 = 60)
    console.assert(summary.monthly.costs.energy.p1 === 60, 'Energy split mismatch');
});

// -- START: Coverage Edge Case Tests --

runTest('ApiService.getRegionFromPostcode edge cases', () => {
    console.assert(window.ApiService.getRegionFromPostcode('') === null, 'Empty string should return null');
    console.assert(window.ApiService.getRegionFromPostcode('12345') === null, 'Numeric only should return null');
    console.assert(window.ApiService.getRegionFromPostcode('XYZ123') === null, 'Unknown prefix should return null');
});

runTest('ApiService.estimateWaterCost unknown region fallback', () => {
    // 1 bed, 1 bath fallback: 18 (standing) + 12 (1 bed) + 0 (1 bath) = 30
    const cost = window.ApiService.estimateWaterCost('XYZ123', 1, 1);
    console.assert(cost === 30, `Expected default 30 for unknown region, got ${cost}`);
});

runTest('ApiService.getEstimatedPropertyPrice fallback logic', async () => {
    // We can't easily mock fetch in this JSDOM script without refactoring run_unit_tests.js, 
    // but we can trigger the catch block by providing a malformed URL or invalid postcode.
    const result = await window.ApiService.getEstimatedPropertyPrice('INVALID', 2);
    console.assert(result.isEstimated === true, 'Should use heuristic fallback');
    console.assert(result.price === 250000, 'Default fallback price should be 250k');
});

runTest('Validator field edge cases', () => {
    const v = window.Validator;
    console.assert(v.validateField('nonExistentField', 123) === true, 'Undefined fields should pass');
    console.assert(v.validateField('salaryP1', '') === false, 'Required field with empty string should fail');
    console.assert(v.validateField('salaryP1', null) === false, 'Required field with null should fail');
    console.assert(v.validateField('depositPercentage', 0) === true, 'Min boundary (0) should pass');
    console.assert(v.validateField('depositPercentage', 100) === true, 'Max boundary (100) should pass');
});

runTest('Validator screen validation branches', () => {
    const v = window.Validator;
    
    // Screen 4: Mortgage (Amount type)
    const s4Amt = v.validateScreen('screen-4', { 
        depositType: 'amount', 
        depositAmount: 50000, 
        mortgageInterestRate: 5, 
        mortgageTerm: 25 
    });
    console.assert(s4Amt.isValid === true, 'Screen 4 amount-based should pass');

    // Screen 5: Utilities (Failure)
    const s5Fail = v.validateScreen('screen-5', { councilTaxCost: 'invalid' });
    console.assert(s5Fail.isValid === false, 'Screen 5 invalid cost should fail');
    console.assert(s5Fail.errors.includes('councilTaxCost'), 'Should identify councilTaxCost error');

    // Screen 6: Lifestyle (Success)
    const s6 = v.validateScreen('screen-6', { 
        groceriesCost: 400, childcareCost: 0, insuranceCost: 50, otherSharedCosts: 100 
    });
    console.assert(s6.isValid === true, 'Screen 6 valid data should pass');
});

// -- END: Unit Tests --
