// Mocking the DOM and other dependencies for testing
const appData = {
  salaryP1: 0,
  salaryP2: 0,
  ratioP1: 0.5,
  ratioP2: 0.5,
  propertyPrice: 0,
  depositPercentage: 0,
  depositSplitProportional: true,
  totalEquity: 0,
  mortgageRequired: 0,
  equityP1: 0,
  equityP2: 0,
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

const elements = {
  propertyPrice: { value: '' },
  depositPercentage: { value: '' },
  sdltEstimate: { value: '' },
  legalFeesEstimate: { value: '' },
  totalEquityDisplay: { innerText: '' },
  mortgageRequiredDisplay: { innerText: '' },
  equityP1Display: { innerText: '' },
  equityP2Display: { innerText: '' },
};

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
  console.assert(textDiv.innerText === 'Test Message', 'Text content should be correct');
});

// -- END: Unit Tests --
