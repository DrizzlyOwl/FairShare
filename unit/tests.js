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
  const tax = calculateTieredTax(0, TAX_BRACKETS.EN.standard);
  console.assert(tax === 0, `Expected 0, but got ${tax}`);
});

runTest(
  'calculateTieredTax should calculate tax for the first bracket correctly',
  () => {
    const tax = calculateTieredTax(100000, TAX_BRACKETS.EN.standard);
    console.assert(tax === 0, `Expected 0, but got ${tax}`);
  }
);

runTest(
  'calculateTieredTax should calculate tax across multiple brackets',
  () => {
    const tax = calculateTieredTax(300000, TAX_BRACKETS.EN.standard);
    // (125000 * 0) + (125000 * 0.02) + (50000 * 0.05) = 0 + 2500 + 2500 = 5000
    console.assert(tax === 5000, `Expected 5000, but got ${tax}`);
  }
);

runTest('getRegionFromPostcode should identify a Scottish postcode', () => {
  const region = getRegionFromPostcode('EH1 1AD');
  console.assert(
    region === 'SCOTLAND',
    `Expected 'SCOTLAND', but got '${region}'`
  );
});

runTest('getRegionFromPostcode should identify a Welsh postcode', () => {
  const region = getRegionFromPostcode('CF10 1AA');
  console.assert(region === 'WALES', `Expected 'WALES', but got '${region}'`);
});

runTest(
  'calculateStampDuty should apply FTB relief for England',
  () => {
    // Property price £300,000, FTB in England
    const duty = calculateStampDuty(300000, 'EN', 'first', true);
    // (300000 * 0) = 0
    console.assert(duty === 0, `Expected 0, but got ${duty}`);
  }
);

runTest(
  'calculateStampDuty should apply additional property surcharge',
  () => {
    // Property price £300,000, second home in England
    const duty = calculateStampDuty(300000, 'EN', 'second', false);
    // Standard tax: 5000. Surcharge: 300000 * 0.03 = 9000. Total = 14000
    const expectedDuty =
      calculateTieredTax(300000, TAX_BRACKETS.EN.standard) + 300000 * 0.03;
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

runTest('updateSalaryType should update labels, appData and clear errors', () => {
  // Mock elements and functions needed for updateSalaryType
  const mockElements = {
    salaryP1Label: { innerText: '' },
    salaryP2Label: { innerText: '' },
    salaryP1: { placeholder: '' },
    salaryP2: { placeholder: '' },
    salaryP1ErrorText: { innerText: '' },
    salaryP2ErrorText: { innerText: '' },
    wkIncomeSubtitle: { innerText: '' },
    salaryP1Error: { setAttribute: (attr, val) => { mockElements.salaryP1Error[attr] = val; } },
    salaryP2Error: { setAttribute: (attr, val) => { mockElements.salaryP2Error[attr] = val; } }
  };
  
  // Mock global functions
  window.updateRatioBar = () => {};
  window.saveToCache = () => {};
  
  // Update window elements
  Object.assign(window.elements, mockElements);
  
  // Test switch to net
  updateSalaryType('net');
  console.assert(appData.salaryType === 'net', 'appData.salaryType should be net');
  console.assert(window.elements.salaryP1Label.innerText === 'Your Monthly Take-home Pay', 'P1 label should be net');
  console.assert(window.elements.salaryP1Error.hidden === '', 'P1 error should be hidden');
  
  // Test switch back to gross
  updateSalaryType('gross');
  console.assert(appData.salaryType === 'gross', 'appData.salaryType should be gross');
  console.assert(window.elements.salaryP1Label.innerText === 'Your Annual Salary (Pre-tax)', 'P1 label should be gross');
});

runTest('updateSalaryType should handle zero salary and calculate 100/0 ratio', () => {
  // Setup data
  appData.salaryP1 = 50000;
  appData.salaryP2 = 0;
  
  // Mock updateRatioBar to verify it's called
  let ratioBarCalled = false;
  window.updateRatioBar = () => { ratioBarCalled = true; };
  
  updateSalaryType('gross');
  
  console.assert(appData.ratioP1 === 1, 'Ratio P1 should be 1.0 (100%)');
  console.assert(appData.ratioP2 === 0, 'Ratio P2 should be 0.0 (0%)');
  console.assert(ratioBarCalled === true, 'updateRatioBar should have been called');
});

runTest('updateTaxEstimate should estimate Basic Rate for £30k', () => {
  const badge = document.createElement('div');
  badge.id = 'salaryP1-tax-badge';
  document.body.appendChild(badge);
  
  window.elements.salaryP1 = { value: '30000' };
  window.appData.salaryType = 'gross';
  
  updateTaxEstimate('P1');
  
  console.assert(badge.innerText.includes('Basic Rate'), `Expected Basic Rate but got: ${badge.innerText}`);
  console.assert(badge.innerText.includes('£2,093'), `Expected approx £2,093 but got: ${badge.innerText}`);
  
  document.body.removeChild(badge);
});

runTest('updateTaxEstimate should estimate Higher Rate for £60k', () => {
  const badge = document.createElement('div');
  badge.id = 'salaryP2-tax-badge';
  document.body.appendChild(badge);
  
  window.elements.salaryP2 = { value: '60000' };
  window.appData.salaryType = 'gross';
  
  updateTaxEstimate('P2');
  
  console.assert(badge.innerText.includes('Higher Rate'), `Expected Higher Rate but got: ${badge.innerText}`);
  console.assert(badge.innerText.includes('£3,780'), `Expected approx £3,780 but got: ${badge.innerText}`);
  
  document.body.removeChild(badge);
});

runTest('calculateEquityDetails should include mortgage fees in total upfront cash', () => {
  // Setup data
  appData.propertyPrice = 200000;
  appData.depositPercentage = 10; // £20,000
  appData.regionCode = 'EN';
  appData.homeType = 'first';
  appData.isFTB = true;
  
  // Mock elements
  const mockElements = {
    mortgageFees: { value: '999' },
    depositPercentage: { value: '10' },
    totalEquityDisplay: { innerText: '' },
    totalUpfrontDisplay: { innerText: '' },
    mortgageRequiredDisplay: { innerText: '' },
    equityP1Display: { innerText: '' },
    equityP2Display: { innerText: '' },
    sdltEstimate: { value: '' },
    sdltDisplay: { innerText: '' },
    legalFeesEstimate: { value: '' }
  };
  Object.assign(window.elements, mockElements);
  
  calculateEquityDetails();
  
  // SDLT for £200k FTB in EN is 0
  // Legal fees for £200k is 1200
  // Total = 20000 (deposit) + 0 (sdlt) + 1200 (legal) + 999 (fees) = 22199
  
  console.assert(appData.mortgageFees === 999, `Expected 999 fees, but got ${appData.mortgageFees}`);
  console.assert(window.elements.totalUpfrontDisplay.innerText.includes('£22,199'), `Expected £22,199 total upfront, but got ${window.elements.totalUpfrontDisplay.innerText}`);
});

runTest('calculateFinalSplit should correctly split upfront costs', () => {
  // Setup data
  appData.propertyPrice = 300000;
  appData.depositPercentage = 10; 
  appData.totalEquity = 30000;
  appData.mortgageFees = 1000;
  appData.regionCode = 'EN';
  appData.homeType = 'first';
  appData.isFTB = false;
  appData.ratioP1 = 0.6;
  appData.ratioP2 = 0.4;
  appData.depositSplitProportional = true;
  
  // SDLT for 300k Standard in EN = (125k * 0) + (125k * 0.02) + (50k * 0.05) = 0 + 2500 + 2500 = 5000
  // Legal fees for 300k = 1200
  // Total Upfront = 30000 + 5000 + 1200 + 1000 = 37200
  // P1 Share (60%) = 22320
  // P2 Share (40%) = 14880
  
  // Mock elements
  const mockElements = {
    totalUpfrontDisplay: { innerText: '' },
    equityP1Display: { innerText: '' },
    equityP2Display: { innerText: '' },
    resultP1: { innerText: '' },
    resultP2: { innerText: '' },
    totalBillDisplay: { innerText: '' },
    resultSummary: { querySelector: () => ({ innerText: '' }), removeAttribute: () => {} },
    wkSalaryP1: { innerText: '' },
    wkSalaryP2: { innerText: '' },
    wkTotalSalary: { innerText: '' },
    wkP1Perc: { innerText: '' },
    wkP2Perc: { innerText: '' }
  };

  // Mock global functions
  const originalSwitchScreen = window.switchScreen;
  window.switchScreen = () => {};
  window.updateRatioBar = () => {};
  window.saveToCache = () => {};
  window.updateBreakdownRow = () => {};
  
  // Update window elements
  Object.assign(window.elements, mockElements);
  
  // Mock document.querySelector for SplitType
  const originalQuerySelector = document.querySelector;
  document.querySelector = (selector) => {
    if (selector.includes('SplitType')) return { checked: true, value: 'yes' };
    return null;
  };
  
  calculateFinalSplit();
  
  console.assert(elements.totalUpfrontDisplay.innerText.includes('£37,200'), `Expected £37,200 total, but got ${elements.totalUpfrontDisplay.innerText}`);
  console.assert(elements.equityP1Display.innerText.includes('£22,320'), `Expected £22,320 for P1, but got ${elements.equityP1Display.innerText}`);
  console.assert(elements.equityP2Display.innerText.includes('£14,880'), `Expected £14,880 for P2, but got ${elements.equityP2Display.innerText}`);
  
  // Restore
  document.querySelector = originalQuerySelector;
  window.switchScreen = originalSwitchScreen;
});

// -- END: Unit Tests --
