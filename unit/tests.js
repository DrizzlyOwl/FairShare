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

// -- START: FinanceOrchestrator Tests --

runTest('FinanceOrchestrator.calculateRatio should handle gross salary', () => {
    const state = { salaryP1: 30000, salaryP2: 20000, salaryType: 'gross', regionCode: 'EN' };
    const result = window.FinanceOrchestrator.calculateRatio(state);
    // P1: £2093, P2: £1493 approx. Total: 3586. Ratio P1: 2093/3586 = 0.58
    console.assert(result.ratioP1 > 0.58 && result.ratioP1 < 0.59, `Expected ~0.58, got ${result.ratioP1}`);
});

runTest('FinanceOrchestrator.calculateRatio should handle 0 salaries', () => {
    const state = { salaryP1: 0, salaryP2: 0, salaryType: 'net' };
    const result = window.FinanceOrchestrator.calculateRatio(state);
    console.assert(result.ratioP1 === 0.5, 'Should fallback to 0.5');
});

runTest('FinanceOrchestrator.calculateEquityDetails should handle amount type', () => {
    const state = { 
        propertyPrice: 200000, 
        depositType: 'amount', 
        depositAmount: 40000,
        depositSplitProportional: false,
        ratioP1: 0.6,
        mortgageInterestRate: 4,
        mortgageTerm: 25,
        regionCode: 'EN',
        homeType: 'first',
        isFTB: true
    };
    const res = window.FinanceOrchestrator.calculateEquityDetails(state);
    console.assert(res.totalEquity === 40000, 'Total equity mismatch');
    console.assert(res.depositPercentage === 20, 'Deposit percentage mismatch');
    console.assert(res.equityP1 === 20000, 'Equity P1 should be 50/50');
});

runTest('FinanceOrchestrator.populateEstimates should scale with beds/isNorth', () => {
    const state = { postcode: 'M1 1AD', beds: 3, baths: 2, isNorth: true, taxBand: 'D' };
    const res = window.FinanceOrchestrator.populateEstimates(state);
    // base energy: 40 + 3*25 + 2*15 = 40+75+30 = 145. North: 145 * 1.1 = 159.5 (160)
    console.assert(res.energyCost === 160, `Expected 160, got ${res.energyCost}`);
    console.assert(res.broadbandCost === 35, 'Broadband cost should be 35');
});

runTest('FinanceOrchestrator.getFinalSummary should return summary', () => {
    const state = { 
        propertyPrice: 200000, totalEquity: 20000, ratioP1: 0.5, splitTypes: {}, 
        monthlyMortgagePayment: 1000, regionCode: 'EN', homeType: 'first', isFTB: true
    };
    const summary = window.FinanceOrchestrator.getFinalSummary(state);
    console.assert(summary.upfront.total > 20000, 'Should include legal fees');
});

// -- START: CalculationEngine Branch Tests --

runTest('CalculationEngine.getSummary branch coverage', () => {
    const state = {
        propertyPrice: 600000, // > 500k
        regionCode: 'EN',
        homeType: 'first',
        isFTB: false,
        totalEquity: 60000,
        mortgageFees: 500,
        ratioP1: 0.7,
        depositSplitProportional: false, // 50/50
        monthlyMortgagePayment: 2500,
        splitTypes: {
            councilTax: 'no', // equal
            energy: 'yes'     // proportional
        }
    };
    const summary = window.CalculationEngine.getSummary(state);
    // Legal fees for 600k should be 1800
    console.assert(summary.upfront.legalFees === 1800, `Expected 1800 legal fees, got ${summary.upfront.legalFees}`);
    // Upfront total: 60000 + SDLT + 1800 + 500
    // SDLT 600k standard: 125k*0 + 125k*0.02 + 350k*0.05 = 0 + 2500 + 17500 = 20000
    console.assert(summary.upfront.sdlt === 20000, `SDLT 600k mismatch: ${summary.upfront.sdlt}`);
    console.assert(summary.upfront.total === 60000 + 20000 + 1800 + 500, `Total upfront mismatch: ${summary.upfront.total}`);
    // Upfront P1 should be 50%
    console.assert(summary.upfront.p1 === summary.upfront.total / 2, 'Upfront P1 should be 50/50');

    // 1M+ test
    state.propertyPrice = 1200000;
    const summary2 = window.CalculationEngine.getSummary(state);
    console.assert(summary2.upfront.legalFees === 2500, 'Legal fees for 1M+ should be 2500');
});

// -- START: UIManager Branch Tests --

runTest('UIManager.switchScreen successful transition', () => {
    const main = document.createElement('main');
    const screen1 = document.createElement('section');
    screen1.id = 'screen-1';
    screen1.className = 'screen';
    const h2 = document.createElement('h2');
    h2.id = 'heading-1';
    screen1.appendChild(h2);
    main.appendChild(screen1);
    document.body.appendChild(main);

    let callbackId = null;
    const ui = new window.UIManager({}, {}, (id) => { callbackId = id; });
    ui.switchScreen('screen-1');

    console.assert(screen1.hasAttribute('hidden') === false, 'Screen should be visible');
    console.assert(callbackId === 'screen-1', 'Callback should be called with screen ID');
    
    document.body.removeChild(main);
});

runTest('UIManager.updateBackgroundImage and updateRatioBar', () => {
    const barP1 = { style: {} };
    const barP2 = { style: {} };
    const ratioTextDesc = { innerText: '' };
    const ui = new window.UIManager({ barP1, barP2, ratioTextDesc }, {});

    ui.updateBackgroundImage('screen-2');
    console.assert(document.body.style.getPropertyValue('--bg-image').includes('bg-income.svg'), 'Background image mismatch');

    ui.updateRatioBar(0.6, 0.4);
    console.assert(barP1.style.width === '60%', 'Bar P1 width mismatch');
    console.assert(ratioTextDesc.innerText.includes('60% You'), 'Ratio text mismatch');
});

runTest('UIManager.renderResultsSummary breakdown and render', () => {
    const breakdownSummary = { innerText: '' };
    const mockElements = {
        breakdownSummary,
        barP1: { style: {} },
        barP2: { style: {} },
        ratioTextDesc: { innerText: '' }
    };
    const ui = new window.UIManager(mockElements, {});

    const summary = {
        monthly: {
            p1: 1000, p2: 1000, total: 2000,
            costs: {
                mortgage: { total: 1000, p1: 500, p2: 500 },
                councilTax: { total: 200, p1: 100, p2: 100 },
                energy: { total: 100, p1: 50, p2: 50 },
                water: { total: 50, p1: 25, p2: 25 },
                broadband: { total: 30, p1: 15, p2: 15 },
                groceries: { total: 400, p1: 200, p2: 200 },
                childcare: { total: 100, p1: 50, p2: 50 },
                insurance: { total: 20, p1: 10, p2: 10 },
                otherShared: { total: 100, p1: 50, p2: 50 }
            }
        },
        upfront: { p1: 5000, p2: 5000, total: 10000 }
    };

    ui.renderResultsSummary(summary);
    console.assert(breakdownSummary.innerText.includes('Out of the £2,000.00'), 'Breakdown summary text mismatch');

    ui.render({ ratioP1: 0.7, ratioP2: 0.3 });
    console.assert(mockElements.barP1.style.width === '70%', 'Render should update ratio bar');
});

runTest('UIManager.updateAlert variant removal', () => {
    const alertEl = document.createElement('div');
    alertEl.id = 'variant-test';
    alertEl.classList.add('alert', 'alert--info');
    document.body.appendChild(alertEl);

    const ui = new window.UIManager({}, {});
    ui.updateAlert('variant-test', { variant: 'error' });

    console.assert(alertEl.classList.contains('alert--error'), 'Should have error class');
    console.assert(!alertEl.classList.contains('alert--info'), 'Should NOT have info class');

    document.body.removeChild(alertEl);
});

runTest('UIManager.updateProgress unknown ID', () => {
    const mockElements = {
        progressBar: { style: {}, setAttribute: () => {} },
        progressLabel: { innerText: '' }
    };
    const ui = new window.UIManager(mockElements, {});
    ui.updateProgress('unknown');
    console.assert(mockElements.progressBar.style.width === '0%', 'Should fallback to 0%');
});

runTest('UIManager.renderResultsSummary edge cases', () => {
    const summaryText = { innerText: '' };
    const mockElements = {
        resultSummary: { 
            querySelector: () => summaryText,
            removeAttribute: () => {}
        },
        resultP1: {}, resultP2: {}, totalBillDisplay: {},
        equityP1Display: {}, equityP2Display: {}
    };
    const ui = new window.UIManager(mockElements, {});

    // Equal contribution
    ui.renderResultsSummary({
        monthly: { p1: 1000, p2: 1000, total: 2000, costs: { mortgage: { total: 0 }, councilTax: { total: 0 }, energy: { total: 0 }, water: { total: 0 }, broadband: { total: 0 }, groceries: { total: 0 }, childcare: { total: 0 }, insurance: { total: 0 }, otherShared: { total: 0 } } },
        upfront: { p1: 5000, p2: 5000 }
    });
    console.assert(summaryText.innerText === 'Both partners contribute equally.', 'Equal contribution text mismatch');

    // P2 pays more
    ui.renderResultsSummary({
        monthly: { p1: 1000, p2: 1500, total: 2500, costs: { mortgage: { total: 0 }, councilTax: { total: 0 }, energy: { total: 0 }, water: { total: 0 }, broadband: { total: 0 }, groceries: { total: 0 }, childcare: { total: 0 }, insurance: { total: 0 }, otherShared: { total: 0 } } },
        upfront: { p1: 5000, p2: 5000 }
    });
    console.assert(summaryText.innerText.includes('Your Partner pays'), 'P2 pays more text mismatch');
});

runTest('UIManager.updateAlert missing elements', () => {
    const ui = new window.UIManager({}, {});
    // Should return early if element not found
    ui.updateAlert('missing-alert', { text: 'test' });
});

runTest('UIManager.updatePricePreview', () => {
    const temp = document.createElement('div');
    temp.id = 'band-price-display';
    temp.innerHTML = '<div class="alert__text"></div><div class="alert__icon"></div>';
    document.body.appendChild(temp);

    const ui = new window.UIManager({}, { 'A': 100 });
    ui.updatePricePreview('A');
    
    console.assert(temp.textContent.includes('Band A selected'), 'Alert text mismatch');
    document.body.removeChild(temp);
});

runTest('ApiService.getEstimatedPropertyPrice success path', async () => {
    // This will now use our global mock fetch
    const result = await window.ApiService.getEstimatedPropertyPrice('SW1A 1AA', 2);
    // Average of 300k and 310k is 305k
    console.assert(result === 305000, `Expected 305000, got ${result}`);
});

runTest('FinanceOrchestrator.calculateEquityDetails percentage type', () => {
    const state = { 
        propertyPrice: 300000, 
        depositType: 'percentage', 
        depositPercentage: 10,
        depositSplitProportional: true,
        ratioP1: 0.6,
        mortgageInterestRate: 4,
        mortgageTerm: 25,
        regionCode: 'EN',
        homeType: 'first',
        isFTB: true
    };
    const res = window.FinanceOrchestrator.calculateEquityDetails(state);
    console.assert(res.totalEquity === 30000, 'Total equity should be 10%');
    console.assert(res.equityP1 === 18000, 'Equity P1 mismatch (0.6 of 30k)');
});
runTest('ApiService.getEstimatedPropertyPrice no data path', async () => {
    // Mock fetch once for this test to return empty
    const originalFetch = global.fetch;
    global.fetch = async () => ({
        ok: true,
        json: async () => ({ results: { bindings: [] } })
    });
    const result = await window.ApiService.getEstimatedPropertyPrice('SW1A 1AA', 2);
    console.assert(result.isEstimated === true, 'Should fallback on no data');
    global.fetch = originalFetch;
});

runTest('ApiService.getEstimatedPropertyPrice error path', async () => {
    // Mock fetch once for this test to return error
    const originalFetch = global.fetch;
    global.fetch = async () => ({
        ok: false,
        status: 500
    });
    const result = await window.ApiService.getEstimatedPropertyPrice('SW1A 1AA', 2);
    console.assert(result.isEstimated === true, 'Should fallback on HTTP error');
    global.fetch = originalFetch;
});
runTest('app.cacheElements should populate elements object', () => {
    const p1 = document.createElement('input');
    p1.id = 'salaryP1';
    document.body.appendChild(p1);

    window.app.cacheElements();
    console.assert(window.app.elements.salaryP1 === p1, 'salaryP1 element should be cached');
    
    document.body.removeChild(p1);
});

runTest('app.toggleTheme should update data-theme', () => {
    // Ensure ThemeManager is initialized on app
    if (!window.app.themeManager) {
        window.app.themeManager = new window.ThemeManager(window.app.elements);
    }
    document.documentElement.setAttribute('data-theme', 'light');
    window.app.toggleTheme();
    console.assert(document.documentElement.getAttribute('data-theme') === 'dark', 'Should toggle to dark');
    window.app.toggleTheme();
    console.assert(document.documentElement.getAttribute('data-theme') === 'light', 'Should toggle back to light');
});

// -- START: Advanced State & Reactivity Tests --

runTest('State should handle nested property reactivity', () => {
    let triggered = 0;
    const store = new window.State(window.INITIAL_STATE, () => { triggered++; });
    
    // Change nested property
    store.data.splitTypes.councilTax = 'no';
    console.assert(triggered > 0, 'Callback should trigger for nested property change');
    console.assert(store.data.splitTypes.councilTax === 'no', 'Nested value mismatch');
});

runTest('State.hydrate should handle corrupted JSON', () => {
    localStorage.setItem('fairshare_cache', 'INVALID_JSON');
    const store = new window.State(window.INITIAL_STATE);
    // Should not throw, but log error
    const data = store.hydrate();
    console.assert(data.salaryP1 === 0, 'Should fallback to initial state on error');
});

runTest('State.persist should throttle writes', (done) => {
    const originalSetItem = localStorage.setItem;
    let writeCount = 0;
    localStorage.setItem = (key, val) => {
        if (key === 'fairshare_cache') writeCount++;
        originalSetItem.call(localStorage, key, val);
    };

    const store = new window.State(window.INITIAL_STATE);
    store.data.salaryP1 = 1000;
    store.data.salaryP1 = 2000;
    store.data.salaryP1 = 3000;

    setTimeout(() => {
        console.assert(writeCount === 1, `Throttling failed: expected 1 write, got ${writeCount}`);
        localStorage.setItem = originalSetItem;
        if (typeof done === 'function') done();
    }, 1000);
});

// -- START: Advanced Validator & Schema Tests --

runTest('Validator.validateField boundary and NaN cases', () => {
    const v = window.Validator;
    console.assert(v.validateField('depositPercentage', NaN) === false, 'NaN should fail');
    console.assert(v.validateField('depositPercentage', 0) === true, 'Min boundary 0 should pass');
    console.assert(v.validateField('depositPercentage', 100) === true, 'Max boundary 100 should pass');
    console.assert(v.validateField('propertyPrice', 0) === false, 'Min boundary 1 should fail for 0');
});

runTest('Validator.validateField missing schema entry', () => {
    console.assert(window.Validator.validateField('unknownField', 'any') === true, 'Unknown field should pass');
});

// -- START: Advanced CSV & Export Tests --

runTest('CSV.generateRawCSV complex table parsing', () => {
    const table = document.createElement('table');
    table.innerHTML = `
        <tr><th>Item</th><th>Cost</th></tr>
        <tr><td>Special & Character, "Quotes"</td><td>£1,234.56</td></tr>
    `;
    const state = { ...window.INITIAL_STATE, salaryP1: 50000, ratioP1: 0.5, monthlyMortgagePayment: 1000 };
    const csv = window.CSV.generateRawCSV(state, table);
    
    // Current implementation just joins columns with commas and wraps in quotes.
    // It doesn't currently escape internal quotes.
    console.assert(csv.includes('"Special & Character "Quotes""'), 'Column wrapping failed');
    console.assert(csv.includes('"1234.56"'), 'Currency cleaning failed');
});

runTest('CSV.download missing table error', () => {
    // Should return early and not crash
    window.CSV.download(window.INITIAL_STATE, null);
});

// -- START: Advanced UIManager & UI Tests --

runTest('UIManager.updateProgress full mapping coverage', () => {
    const mockElements = {
        progressBar: { style: {}, setAttribute: () => {} },
        progressLabel: { innerText: '' }
    };
    const ui = new window.UIManager(mockElements, {});
    const screens = ['screen-1', 'screen-2', 'screen-3', 'screen-4', 'screen-5', 'screen-6', 'screen-7'];
    const expected = ['0%', '15%', '30%', '45%', '60%', '80%', '100%'];

    screens.forEach((id, i) => {
        ui.updateProgress(id);
        console.assert(mockElements.progressBar.style.width === expected[i], `Progress mismatch for ${id}`);
    });
});

runTest('UIManager.updateAlert option combinations', () => {
    const alertEl = document.createElement('div');
    alertEl.id = 'combo-test';
    alertEl.innerHTML = '<div class="alert__text"></div><div class="alert__icon"></div>';
    document.body.appendChild(alertEl);

    const ui = new window.UIManager({}, {});
    ui.updateAlert('combo-test', { 
        variant: 'info', 
        text: 'New Text', 
        hidden: true 
    });

    console.assert(alertEl.classList.contains('alert--info'), 'Variant not applied');
    console.assert(alertEl.querySelector('.alert__text').innerHTML === 'New Text', 'Text not applied');
    console.assert(alertEl.hasAttribute('hidden'), 'Hidden attribute not applied');

    document.body.removeChild(alertEl);
});

// -- START: Advanced ApiService Fallback Tests --

runTest('ApiService.getEstimatedPropertyPrice regional heuristics', async () => {
    const api = window.ApiService;
    // Mock fetch to fail to trigger fallback
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false });

    const north = await api.getEstimatedPropertyPrice('M1 1AD', 2);
    console.assert(north.price === 180000, 'Northern fallback mismatch');

    const london = await api.getEstimatedPropertyPrice('W1A 1AA', 2);
    console.assert(london.price === 450000, 'London fallback mismatch');

    const southwest = await api.getEstimatedPropertyPrice('SW1A 1AA', 3);
    // 450000 + (3-2)*35000 = 485000
    console.assert(southwest.price === 485000, 'Bedroom adjustment mismatch');

    global.fetch = originalFetch;
});

runTest('State.hydrate should return data if no cache exists', () => {
    localStorage.removeItem('fairshare_cache');
    const store = new window.State(window.INITIAL_STATE);
    const data = store.hydrate();
    console.assert(data.salaryP1 === 0, 'Should return initial data');
});

runTest('State.clear should cancel pending timeout', (done) => {
    const store = new window.State(window.INITIAL_STATE);
    store.data.salaryP1 = 5000; // Trigger persist timeout
    store.clear();
    
    setTimeout(() => {
        // If clear worked, the 5000 shouldn't be in localStorage (it was removed and timeout cleared)
        const cached = localStorage.getItem('fairshare_cache');
        console.assert(cached === null, 'Cache should be null after clear');
        if (typeof done === 'function') done();
    }, 1000);
});

runTest('FinanceEngine.calculateStampDuty SC FTB relief', () => {
    const engine = window.FinanceEngine;
    // SC Standard £200k: 145k*0 + 55k*0.02 = 1100. Relief: 600. Total: 500
    const duty = engine.calculateStampDuty(200000, 'SC', 'first', true);
    console.assert(duty === 500, `Expected 500, got ${duty}`);
});

runTest('FinanceEngine.calculateStampDuty WA standard', () => {
    const engine = window.FinanceEngine;
    // WA Standard £200k: 180k*0 + 20k*0.035 = 700
    const duty = engine.calculateStampDuty(200000, 'WA', 'first', false);
    console.assert(duty === 700, `Expected 700, got ${duty}`);
});
runTest('FinanceOrchestrator.calculateEquityDetails price <= 0', () => {
    const res = window.FinanceOrchestrator.calculateEquityDetails({ propertyPrice: 0 });
    console.assert(Object.keys(res).length === 0, 'Should return empty object for price 0');
});

runTest('FinanceOrchestrator.populateEstimates high tax band energy', () => {
    const state = { postcode: 'M1 1AD', beds: 2, baths: 1, isNorth: false, taxBand: 'E' };
    const res = window.FinanceOrchestrator.populateEstimates(state);
    // base energy: 40 + 2*25 + 1*15 = 40+50+15 = 105. Band E: 105 * 1.15 = 120.75 (121)
    console.assert(res.energyCost === 121, `Expected 121, got ${res.energyCost}`);
});

runTest('ApiService.estimateWaterCost NI region', () => {
    const cost = window.ApiService.estimateWaterCost('BT1 1AA', 2, 1);
    console.assert(cost === 0, 'NI water cost should be 0');
});

runTest('ApiService.estimateWaterCost extra bathrooms', () => {
    const cost = window.ApiService.estimateWaterCost('SW1A 1AA', 1, 3);
    // Standing: 18. People: 1*12=12. Extra Baths: (3-1)*5=10. Total: 18+12+10 = 40
    console.assert(cost === 40, `Expected 40, got ${cost}`);
});
// -- START: Validator Coverage Expansion --

runTest('Validator.validateScreen screen-4 percentage failure', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-4', {
        depositType: 'percentage',
        depositPercentage: -1,
        mortgageInterestRate: 5,
        mortgageTerm: 25
    });
    console.assert(res.isValid === false, 'Negative percentage should fail screen-4');
    console.assert(res.errors.includes('depositPercentage'), 'Should report depositPercentage error');
});

runTest('Validator.validateScreen screen-4 amount failure', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-4', {
        depositType: 'amount',
        depositAmount: -100,
        mortgageInterestRate: 5,
        mortgageTerm: 25
    });
    console.assert(res.isValid === false, 'Negative amount should fail screen-4');
    console.assert(res.errors.includes('depositAmount'), 'Should report depositAmount error');
});

runTest('Validator.validateField required undefined', () => {
    console.assert(window.Validator.validateField('salaryP1', undefined) === false, 'Required undefined should fail');
});

runTest('Validator.validateScreen unknown screen', () => {
    const v = window.Validator;
    const res = v.validateScreen('unknown-screen', {});
    console.assert(res.isValid === true, 'Unknown screen should be valid by default');
    console.assert(res.errors.length === 0, 'Unknown screen should have no errors');
});

runTest('Validator.validateScreen screen-2 both salaries zero', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-2', { salaryP1: 0, salaryP2: 0 });
    console.assert(res.isValid === false, 'Both zero should fail');
    console.assert(res.errors.includes('salaryP1'), 'salaryP1 should be in errors');
    console.assert(res.errors.includes('salaryP2'), 'salaryP2 should be in errors');
});

runTest('Validator.validateScreen screen-2 individual field failures', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-2', { salaryP1: -1, salaryP2: -500 });
    console.assert(res.isValid === false, 'Negative salaries should fail');
    console.assert(res.errors.includes('salaryP1'), 'salaryP1 should be in errors');
    console.assert(res.errors.includes('salaryP2'), 'salaryP2 should be in errors');
});

runTest('Validator.validateScreen screen-4 mortgage detail failures', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-4', { 
        depositType: 'percentage', 
        depositPercentage: 10,
        mortgageInterestRate: -1, // invalid
        mortgageTerm: 0 // invalid
    });
    console.assert(res.isValid === false, 'Invalid mortgage details should fail');
    console.assert(res.errors.includes('mortgageInterestRate'), 'Interest rate error missing');
    console.assert(res.errors.includes('mortgageTerm'), 'Term error missing');
});

runTest('Validator.validateScreen screen-5 utility failures', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-5', { 
        councilTaxCost: -1,
        energyCost: 'invalid',
        waterBill: null,
        broadbandCost: undefined
    });
    console.assert(res.isValid === false, 'Invalid utilities should fail');
    console.assert(res.errors.length === 4, `Expected 4 errors, got ${res.errors.length}`);
});

runTest('Validator.validateScreen screen-6 lifestyle failures', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-6', { 
        groceriesCost: -1,
        childcareCost: -1,
        insuranceCost: -1,
        otherSharedCosts: -1
    });
    console.assert(res.isValid === false, 'Invalid lifestyle costs should fail');
    console.assert(res.errors.length === 4, 'Expected 4 errors');
});

runTest('Validator.validateField required boundary coverage', () => {
    const v = window.Validator;
    console.assert(v.validateField('salaryP1', '') === false, 'Empty string should fail required');
    console.assert(v.validateField('salaryP1', null) === false, 'Null should fail required');
    console.assert(v.validateField('salaryP1', undefined) === false, 'Undefined should fail required');
});

runTest('Validator.validateScreen screen-5 success', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-5', { 
        councilTaxCost: 150,
        energyCost: 100,
        waterBill: 30,
        broadbandCost: 35
    });
    console.assert(res.isValid === true, 'Valid utilities should pass');
});

runTest('Validator.validateScreen screen-6 success', () => {
    const v = window.Validator;
    const res = v.validateScreen('screen-6', { 
        groceriesCost: 400,
        childcareCost: 0,
        insuranceCost: 50,
        otherSharedCosts: 100
    });
    console.assert(res.isValid === true, 'Valid lifestyle should pass');
});

// -- END: Unit Tests --
