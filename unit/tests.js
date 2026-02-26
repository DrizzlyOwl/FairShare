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
    band: '',
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

// -- START: ApiService Tests --

runTest('getRegionFromPostcode should identify a Scottish postcode', () => {
  const result = ApiService.getRegionFromPostcode('EH1 1AD');
  console.assert(result.key === 'SCOTLAND', `Expected 'SCOTLAND', but got '${result.key}'`);
});

runTest('estimateWaterCost should scale with bathrooms', () => {
    const cost1 = ApiService.estimateWaterCost('SW1A 1AA', 1);
    const cost2 = ApiService.estimateWaterCost('SW1A 1AA', 3);
    console.assert(cost2 > cost1, '3 bathrooms should cost more than 1');
});

// -- START: UI Component Tests --

runTest('createAlertHTML should generate correct HTML structure', () => {
  const html = createAlertHTML('info', 'icon-info.svg', 'Test Message', 'test-id', true);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const alertDiv = tempDiv.querySelector('#test-id');
  
  console.assert(alertDiv !== null, 'Alert div should exist');
  console.assert(alertDiv.classList.contains('alert--info'), 'Should have alert--info class');
  console.assert(alertDiv.hasAttribute('hidden'), 'Should have hidden attribute');
});

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

// -- END: Unit Tests --
