// Mocking the DOM and other dependencies for testing
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
    regionCode: 'EN', // EN, SC, WA, NI
    band: '',
    beds: 0,
    baths: 0,
    homeType: 'first',
    isFTB: false, // First Time Buyer
    // Individual split preferences
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
  };
}

// Helper function to run tests and log results
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✔ ${testName}`);
  } catch (error) {
    console.error(`✖ ${testName}`);
    console.error(error);
  }
}

// -- START: Unit Tests --

runTest('calculateTieredTax should return 0 for £0 price', () => {
  const engine = window.FinanceEngine || { calculateTieredTax: window.calculateTieredTax };
  const brackets = window.TAX_BRACKETS?.EN.standard || window.TAX_BRACKETS.EN.standard;
  const tax = engine.calculateTieredTax(0, brackets);
  console.assert(tax === 0, `Expected 0, but got ${tax}`);
});

runTest(
  'calculateTieredTax should calculate tax for the first bracket correctly',
  () => {
    const engine = window.FinanceEngine || { calculateTieredTax: window.calculateTieredTax };
    const brackets = window.TAX_BRACKETS?.EN.standard || window.TAX_BRACKETS.EN.standard;
    const tax = engine.calculateTieredTax(100000, brackets);
    console.assert(tax === 0, `Expected 0, but got ${tax}`);
  }
);

runTest(
  'calculateTieredTax should calculate tax across multiple brackets',
  () => {
    const engine = window.FinanceEngine || { calculateTieredTax: window.calculateTieredTax };
    const brackets = window.TAX_BRACKETS?.EN.standard || window.TAX_BRACKETS.EN.standard;
    const tax = engine.calculateTieredTax(300000, brackets);
    // (125000 * 0) + (125000 * 0.02) + (50000 * 0.05) = 0 + 2500 + 2500 = 5000
    console.assert(tax === 5000, `Expected 5000, but got ${tax}`);
  }
);

runTest('getRegionFromPostcode should identify a Scottish postcode', () => {
  const result = ApiService.getRegionFromPostcode('EH1 1AD');
  console.assert(
    result.key === 'SCOTLAND',
    `Expected 'SCOTLAND', but got '${result.key}'`
  );
});

runTest('getRegionFromPostcode should identify a Welsh postcode', () => {
  const result = ApiService.getRegionFromPostcode('CF10 1AA');
  console.assert(result.key === 'WALES', `Expected 'WALES', but got '${result.key}'`);
});

runTest(
  'calculateStampDuty should apply FTB relief for England',
  () => {
    const engine = window.FinanceEngine || { calculateStampDuty: window.calculateStampDuty };
    // Property price £300,000, FTB in England
    const duty = engine.calculateStampDuty(300000, 'EN', 'first', true);
    // (300000 * 0) = 0
    console.assert(duty === 0, `Expected 0, but got ${duty}`);
  }
);

runTest(
  'calculateStampDuty should apply additional property surcharge',
  () => {
    const engine = window.FinanceEngine || { 
        calculateStampDuty: window.calculateStampDuty,
        calculateTieredTax: window.calculateTieredTax 
    };
    const brackets = window.TAX_BRACKETS?.EN.standard || window.TAX_BRACKETS.EN.standard;
    
    // Property price £300,000, second home in England
    const duty = engine.calculateStampDuty(300000, 'EN', 'second', false);
    // Standard tax: 5000. Surcharge: 300000 * 0.03 = 9000. Total = 14000
    const expectedDuty = engine.calculateTieredTax(300000, brackets) + 300000 * 0.03;
    console.assert(
      duty === Math.floor(expectedDuty),
      `Expected ${Math.floor(expectedDuty)}, but got ${duty}`
    );
  }
);

runTest('createAlertHTML should generate correct HTML structure', () => {
  const html = createAlertHTML('info', 'icon-info.svg', 'Test Message', 'test-id', true);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const alertDiv = tempDiv.querySelector('#test-id');
  
  console.assert(alertDiv !== null, 'Alert div should exist');
  console.assert(alertDiv.classList.contains('alert'), 'Should have alert class');
  console.assert(alertDiv.classList.contains('alert--info'), 'Should have alert--info class');
  console.assert(alertDiv.hasAttribute('hidden'), 'Should have hidden attribute');
  
  const iconSpan = alertDiv.querySelector('.alert__icon');
  console.assert(iconSpan !== null, 'Icon span should exist');
  console.assert(iconSpan.getAttribute('aria-hidden') === 'true', 'Icon should be aria-hidden');
  console.assert(iconSpan.style.maskImage.includes('icons/icon-info.svg') || iconSpan.style.webkitMaskImage.includes('icons/icon-info.svg'), 'Icon mask-image should be correct');
  
  const textDiv = alertDiv.querySelector('.alert__text');
  console.assert(textDiv !== null, 'Text div should exist');
  console.assert(textDiv.textContent === 'Test Message', 'Text content should be correct');
});

runTest('calculateTakeHome should handle England Basic Rate for £30k', () => {
  const engine = window.FinanceEngine;
  const salary = 30000;
  const result = engine.calculateTakeHome(salary, 'EN');
  
  console.assert(result.bandName === 'Basic Rate', `Expected Basic Rate, but got ${result.bandName}`);
  // Expected tax 3486, NI 1394. Total 4880. Net ~2093
  console.assert(Math.round(result.monthlyNet) === 2093, `Expected approx £2,093, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle England Higher Rate for £80k', () => {
  const engine = window.FinanceEngine;
  const salary = 80000;
  const result = engine.calculateTakeHome(salary, 'EN');
  
  console.assert(result.bandName === 'Higher Rate', `Expected Higher Rate, but got ${result.bandName}`);
  // Expected tax 19432, NI 3610. Total 23042. Net ~4746
  console.assert(Math.round(result.monthlyNet) === 4746, `Expected approx £4,746, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Additional Rate and tapered PA', () => {
  const engine = window.FinanceEngine;
  const salary = 150000;
  const result = engine.calculateTakeHome(salary, 'EN');
  
  console.assert(result.bandName === 'Additional Rate', `Expected Additional Rate, but got ${result.bandName}`);
  // Expected tax 51189, NI 5010. Total 56199. Net ~7817
  console.assert(Math.round(result.monthlyNet) === 7817, `Expected approx £7,817, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Starter Rate for £14k', () => {
  const engine = window.FinanceEngine;
  const salary = 14000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Starter Rate', `Expected Starter Rate, but got ${result.bandName}`);
  // Expected tax 271.51, NI 114.40. Total 385.91. Net ~1134.50 -> 1134
  console.assert(Math.round(result.monthlyNet) === 1134, `Expected approx £1,134, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Basic Rate for £20k', () => {
  const engine = window.FinanceEngine;
  const salary = 20000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Basic Rate', `Expected Basic Rate, but got ${result.bandName}`);
  // Expected tax 1463, NI 594. Total 2057. Net ~1495
  console.assert(Math.round(result.monthlyNet) === 1495, `Expected approx £1,495, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Intermediate Rate for £30k', () => {
  const engine = window.FinanceEngine;
  const salary = 30000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Intermediate Rate', `Expected Intermediate Rate, but got ${result.bandName}`);
  // Expected tax ~3497, NI ~1394. Total deductions ~4891. Net ~2092
  console.assert(Math.round(result.monthlyNet) === 2092, `Expected approx £2,092, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Higher Rate for £60k', () => {
  const engine = window.FinanceEngine;
  const salary = 60000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Higher Rate', `Expected Higher Rate, but got ${result.bandName}`);
  // Expected tax ~13228, NI ~3210. Total deductions ~16438. Net ~3630
  console.assert(Math.round(result.monthlyNet) === 3630, `Expected approx £3,630, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Advanced Rate for £80k', () => {
  const engine = window.FinanceEngine;
  const salary = 80000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Advanced Rate', `Expected Advanced Rate, but got ${result.bandName}`);
  // Expected tax ~21778, NI ~3610. Total 25388. Net ~4551
  console.assert(Math.round(result.monthlyNet) === 4551, `Expected approx £4,551, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Scottish Top Rate for £150k', () => {
  const engine = window.FinanceEngine;
  const salary = 150000;
  const result = engine.calculateTakeHome(salary, 'SC');
  
  console.assert(result.bandName === 'Top Rate', `Expected Top Rate, but got ${result.bandName}`);
  // Expected tax ~56164, NI ~5010. Total 61174. Net ~7402
  console.assert(Math.round(result.monthlyNet) === 7402, `Expected approx £7,402, but got ${Math.round(result.monthlyNet)}`);
});

runTest('calculateTakeHome should handle Personal Allowance boundaries', () => {
  const engine = window.FinanceEngine;
  
  // Exactly at allowance
  const atAllowance = engine.calculateTakeHome(12570, 'EN');
  console.assert(atAllowance.bandName === 'Personal Allowance', `Expected Personal Allowance, but got ${atAllowance.bandName}`);
  console.assert(Math.round(atAllowance.monthlyNet) === 1048, `Expected approx £1,048, but got ${Math.round(atAllowance.monthlyNet)}`);

  // £1 above allowance (EN)
  const aboveAllowanceEN = engine.calculateTakeHome(12571, 'EN');
  console.assert(aboveAllowanceEN.bandName === 'Basic Rate', `Expected Basic Rate, but got ${aboveAllowanceEN.bandName}`);

  // £1 above allowance (SC)
  const aboveAllowanceSC = engine.calculateTakeHome(12571, 'SC');
  console.assert(aboveAllowanceSC.bandName === 'Starter Rate', `Expected Starter Rate, but got ${aboveAllowanceSC.bandName}`);
});

// -- END: Unit Tests --
