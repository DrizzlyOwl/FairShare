// Application Data - Made global for accessibility across functions and testing
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
    totalRepayment: 0,
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
        otherShared: 'yes'
    }
};
window.appData = appData;

window.downloadCSV = () => {
    const table = document.getElementById('results-table');
    if (!table) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "FairShare Bill Splitting Report\n";
    csvContent += `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}\n\n`;

    // 1. Ratio Workings
    csvContent += "1. INCOME RATIO WORKINGS\n";
    csvContent += `Your Annual Salary,${appData.salaryP1}\n`;
    csvContent += `Partner Annual Salary,${appData.salaryP2}\n`;
    csvContent += `Total Combined Salary,${appData.salaryP1 + appData.salaryP2}\n`;
    csvContent += `Your Share %,${(appData.ratioP1 * 100).toFixed(1)}%\n`;
    csvContent += `Partner Share %,${(appData.ratioP2 * 100).toFixed(1)}%\n\n`;

    // 2. Mortgage Workings
    csvContent += "2. MORTGAGE & EQUITY\n";
    csvContent += `Property Value,${appData.propertyPrice}\n`;
    csvContent += `Deposit %,${appData.depositPercentage}%\n`;
    csvContent += `Total Equity,${appData.totalEquity}\n`;
    csvContent += `Mortgage Principal,${appData.mortgageRequired}\n`;
    csvContent += `Interest Rate,${appData.mortgageInterestRate}%\n`;
    csvContent += `Term (Years),${appData.mortgageTerm}\n`;
    csvContent += `Monthly Payment,${appData.monthlyMortgagePayment.toFixed(2)}\n\n`;

    // 3. Full Breakdown Table
    csvContent += "3. FULL COST BREAKDOWN\n";
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = Array.from(cols).map(col => {
            let text = col.innerText.replace(/,/g, ''); // Remove commas from currency for CSV
            text = text.replace('£', ''); // Remove pound sign
            return `"${text}"`;
        });
        csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fairshare_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// DOM Elements Cache - Will be populated in DOMContentLoaded
const elements = {};
window.elements = elements;

const FORM_FIELDS = [
    { id: 'salaryP1', type: 'number' },
    { id: 'salaryP2', type: 'number' },
    { id: 'postcode', type: 'text' },
    { id: 'propertyPrice', type: 'number' },
    { id: 'bedrooms', type: 'number', key: 'beds' },
    { id: 'bathrooms', type: 'number', key: 'baths' },
    { id: 'councilTaxCost', type: 'number' },
    { id: 'energyCost', type: 'number' },
    { id: 'waterBill', type: 'number' },
    { id: 'broadbandCost', type: 'number' },
    { id: 'groceriesCost', type: 'number' },
    { id: 'childcareCost', type: 'number' },
    { id: 'insuranceCost', type: 'number' },
    { id: 'otherSharedCosts', type: 'number' },
    { id: 'depositPercentage', type: 'number' },
    { id: 'mortgageInterestRate', type: 'number' },
    { id: 'mortgageTerm', type: 'number' }
];
window.FORM_FIELDS = FORM_FIELDS;

const bandPrices = { 'A': 110, 'B': 128, 'C': 146, 'D': 165, 'E': 201, 'F': 238, 'G': 275, 'H': 330 };
window.bandPrices = bandPrices;

const CACHE_KEY = 'fairshare_cache';
window.CACHE_KEY = CACHE_KEY;

const SCREENS = {
    LANDING: 'screen-1',
    INCOME: 'screen-2',
    PROPERTY: 'screen-3',
    MORTGAGE: 'screen-4',
    UTILITIES: 'screen-5',
    COMMITTED: 'screen-6',
    RESULTS: 'screen-7'
};
window.SCREENS = SCREENS;

const TAX_BRACKETS = {
    EN: {
        standard: [
            { upto: 125000, rate: 0 },
            { upto: 250000, rate: 0.02 },
            { upto: 925000, rate: 0.05 },
            { upto: 1500000, rate: 0.10 },
            { over: 1500000, rate: 0.12 }
        ],
        ftb: [
            { upto: 300000, rate: 0 },
            { upto: 500000, rate: 0.05 }
        ],
        additionalSurcharge: 0.03
    },
    SC: {
        standard: [
            { upto: 145000, rate: 0 },
            { upto: 250000, rate: 0.02 },
            { upto: 325000, rate: 0.05 },
            { upto: 750000, rate: 0.10 },
            { over: 750000, rate: 0.12 }
        ],
        ftbRelief: 600, // Flat amount
        additionalSurcharge: 0.04
    },
    WA: {
        standard: [
            { upto: 180000, rate: 0 },
            { upto: 250000, rate: 0.035 },
            { upto: 400000, rate: 0.05 },
            { upto: 750000, rate: 0.075 },
            { upto: 1500000, rate: 0.10 },
            { over: 1500000, rate: 0.12 }
        ],
        additionalSurcharge: 0.03
    }
};
window.TAX_BRACKETS = TAX_BRACKETS;

const REGIONS = {
    NI: { name: 'Northern Ireland', prefixes: ['BT'], cost: 0, code: 'NI' },
    SCOTLAND: { name: 'Scotland', prefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'], cost: 42, code: 'SC' },
    WALES: { name: 'Wales', prefixes: ['CF', 'LD', 'LL', 'NP', 'SA', 'SY'], cost: 55, code: 'WA' },
    SOUTH_WEST: { name: 'South West', prefixes: ['BA', 'BH', 'BS', 'DT', 'EX', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'], cost: 62, code: 'EN' },
    SOUTH: { name: 'South', prefixes: ['BN', 'CT', 'GU', 'ME', 'OX', 'PO', 'RG', 'RH', 'SL', 'TN'], cost: 58, code: 'EN' },
    LONDON: { name: 'London', prefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD'], cost: 54, code: 'EN' },
    EAST: { name: 'East of England', prefixes: ['AL', 'CB', 'CM', 'CO', 'EN', 'HP', 'IP', 'LU', 'NR', 'RM', 'SG', 'SS'], cost: 52, code: 'EN' },
    MIDLANDS: { name: 'Midlands', prefixes: ['B', 'CV', 'DE', 'DY', 'HR', 'LE', 'LN', 'NG', 'NN', 'ST', 'SY', 'TF', 'WR', 'WS', 'WV'], cost: 48, code: 'EN' },
    NORTH: { name: 'North of England', prefixes: ['BB', 'BD', 'BL', 'CA', 'CH', 'CW', 'DH', 'DL', 'DN', 'FY', 'HD', 'HG', 'HU', 'HX', 'L', 'LA', 'LS', 'M', 'NE', 'OL', 'PR', 'S', 'SK', 'SR', 'TS', 'WA', 'WF', 'WN', 'YO'], cost: 45, code: 'EN' }
};
window.REGIONS = REGIONS;

// --- Core Functions ---

window.createAlertHTML = (variant, iconName, text, id = '', hidden = false) => {
    const idAttr = id ? `id="${id}"` : '';
    const hiddenAttr = hidden ? 'hidden' : '';
    return `
        <div ${idAttr} class="alert alert--${variant}" ${hiddenAttr}>
            <span class="alert__icon" style="-webkit-mask-image: url('icons/${iconName}'); mask-image: url('icons/${iconName}');" aria-hidden="true"></span>
            <div class="alert__text">${text}</div>
        </div>
    `;
};

window.getVal = (id) => parseFloat(elements[id]?.value) || 0;
window.updateBreakdownRow = (key, total, p1, p2) => {
    if (elements[`bd${key}Total`]) elements[`bd${key}Total`].innerText = formatCurrency(total, 2);
    if (elements[`bd${key}P1`]) elements[`bd${key}P1`].innerText = formatCurrency(p1, 2);
    if (elements[`bd${key}P2`]) elements[`bd${key}P2`].innerText = formatCurrency(p2, 2);
};
window.calculateTieredTax = (price, brackets) => {
    let tax = 0;
    let prevLimit = 0;
    for (const bracket of brackets) {
        if (price > prevLimit) {
            const limit = bracket.upto || Infinity;
            const taxableAmount = Math.min(price, limit) - prevLimit;
            tax += taxableAmount * bracket.rate;
            if (price <= limit) break;
            prevLimit = limit;
        }
    }
    return tax;
};
window.formatCurrency = (num, decimals = 0) => {
    return '£' + num.toLocaleString('en-GB', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};
window.updateOnlineStatus = () => {
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
        if (navigator.onLine) {
            offlineIndicator.setAttribute('hidden', '');
        } else {
            offlineIndicator.removeAttribute('hidden');
        }
    }
};
window.saveToCache = () => {
    const inputs = {};
    FORM_FIELDS.forEach(field => {
        if (elements[field.id]) {
            inputs[field.id] = elements[field.id].value;
        }
    });
    Object.keys(appData.splitTypes).forEach(key => {
        const radio = document.querySelector(`input[name="${key}SplitType"]:checked`);
        if (radio) inputs[`${key}SplitType`] = radio.value;
    });
    const taxBand = document.querySelector('input[name="taxBand"]:checked');
    if (taxBand) inputs.taxBand = taxBand.value;
    const homeType = document.querySelector('input[name="homeType"]:checked');
    if (homeType) inputs.homeType = homeType.value;
    const buyerStatus = document.querySelector('input[name="buyerStatus"]:checked');
    if (buyerStatus) inputs.buyerStatus = buyerStatus.value;
    const depositSplit = document.querySelector('input[name="depositSplitType"]:checked');
    if (depositSplit) inputs.depositSplitType = depositSplit.value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(inputs));
};
window.loadFromCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
        const ftbContainer = document.getElementById('ftb-container');
        if (ftbContainer) {
             if (appData.homeType === 'first') ftbContainer.removeAttribute('hidden');
             else ftbContainer.setAttribute('hidden', '');
        }
        return;
    }
    const inputs = JSON.parse(cached);
    for (const [id, value] of Object.entries(inputs)) {
        if (elements[id]) {
            elements[id].value = value;
        } else {
            if (id.endsWith('SplitType')) {
                const radio = document.querySelector(`input[name="${id}"][value="${value}"]`);
                if (radio) radio.checked = true;
                const dataKey = id.replace('SplitType', '');
                if (appData.splitTypes.hasOwnProperty(dataKey)) {
                    appData.splitTypes[dataKey] = value;
                }
            } else if (id === 'taxBand' || id === 'homeType' || id === 'depositSplitType' || id === 'buyerStatus') {
                const radio = document.querySelector(`input[name="${id}"][value="${value}"]`);
                if (radio) radio.checked = true;
                if (id === 'taxBand') updatePricePreview(value);
            }
        }
    }
    FORM_FIELDS.forEach(field => {
        const val = elements[field.id].value;
        const key = field.key || field.id;
        if (appData.hasOwnProperty(key)) {
            if (field.type === 'number') {
                appData[key] = parseFloat(val) || 0;
            } else {
                appData[key] = val;
            }
        }
    });
    const total = appData.salaryP1 + appData.salaryP2;
    if (total > 0) {
        appData.ratioP1 = appData.salaryP1 / total;
        appData.ratioP2 = appData.salaryP2 / total;
    }
    appData.band = inputs.taxBand || '';
    appData.depositSplitProportional = inputs.depositSplitType === 'yes';
    if (inputs.homeType) appData.homeType = inputs.homeType;
    if (inputs.buyerStatus) appData.isFTB = inputs.buyerStatus === 'ftb';
    if (appData.propertyPrice > 0) {
        updatePropertyPriceDisplay(appData.propertyPrice, false);
    }
    checkRegion();
    const ftbContainer = document.getElementById('ftb-container');
    if (ftbContainer) {
         if (appData.homeType === 'first') ftbContainer.removeAttribute('hidden');
         else ftbContainer.setAttribute('hidden', '');
    }
    calculateEquityDetails();
    calculateMonthlyMortgage();
};
window.setAllSplitTypes = (screen, type) => {
    const groups = screen === 'utilities'
        ? ['councilTax', 'energy', 'water', 'broadband']
        : ['groceries', 'childcare', 'insurance', 'otherShared'];

    groups.forEach(group => {
        const radio = document.querySelector(`input[name="${group}SplitType"][value="${type}"]`);
        if (radio) radio.checked = true;
        appData.splitTypes[group] = type;
    });
    saveToCache();
};
window.formatPostcode = (input) => {
    const value = input.value.replace(/\s+/g, '').toUpperCase();
    if (value.length > 3) {
        const incode = value.slice(-3);
        const outcode = value.slice(0, -3);
        input.value = outcode + ' ' + incode;
    } else {
        input.value = value;
    }
};
window.updatePropertyPriceDisplay = (price, isEstimated) => {
    const display = elements.propertyPriceDisplay;
    if (!display) return;
    if (price > 0) {
        const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
        display.innerHTML = `${labelText}<span id="estimatedPriceValue">${formatCurrency(price)}</span>`;
        display.removeAttribute('hidden');
    } else {
        display.setAttribute('hidden', '');
    }
};
window.isValidPostcode = (postcode) => {
    const postcodeRegEx = /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i;
    return postcodeRegEx.test(postcode);
};
window.getRegionFromPostcode = (postcode) => {
    const pc = postcode.trim().toUpperCase();
    if (!pc) return null;
    const areaMatch = pc.match(/^[A-Z]+/);
    if (!areaMatch) return null;
    const area = areaMatch[0];
    for (const regionKey in REGIONS) {
        if (REGIONS[regionKey].prefixes.includes(area)) {
            return regionKey;
        }
    }
    return null;
};
window.checkRegion = () => {
    const postcodeInput = elements.postcode;
    formatPostcode(postcodeInput);
    const pc = postcodeInput.value.trim().toUpperCase();
    if (pc.length > 0 && !isValidPostcode(pc)) {
        elements.postcodeError.removeAttribute('hidden');
        return;
    } else {
        elements.postcodeError.setAttribute('hidden', '');
    }
    appData.postcode = pc;
    const regionKey = getRegionFromPostcode(pc);
    const northernRegions = ['NORTH', 'MIDLANDS', 'WALES', 'SCOTLAND'];
    const announceDiv = elements.regionAnnouncement;
    const announceText = announceDiv?.querySelector('.alert__text');
    if (regionKey) {
        const regionName = REGIONS[regionKey].name;
        appData.regionCode = REGIONS[regionKey].code;
        announceDiv.removeAttribute('hidden');
        if (northernRegions.includes(regionKey)) {
            appData.isNorth = true;
            if (announceText) announceText.innerText = `${regionName} region detected. Heating estimates adjusted.`;
        } else {
            appData.isNorth = false;
            if (announceText) announceText.innerText = `${regionName} region detected.`;
        }
    } else if (pc.length > 0) {
        appData.isNorth = false;
        appData.regionCode = 'EN'; // Default
        announceDiv.removeAttribute('hidden');
        if (announceText) announceText.innerText = "Region could not be determined.";
    } else {
        announceDiv.setAttribute('hidden', '');
        if (announceText) announceText.innerText = "";
    }
};
window.getEstimatedPropertyPrice = async (postcode) => {
    const sparqlQuery = `
        PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
        PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
        SELECT ?amount WHERE {
            ?addr lrcommon:postcode "${postcode}" .
            ?transx lrppi:propertyAddress ?addr ;
                    lrppi:pricePaid ?amount .
        } LIMIT 10
    `;
    const endpointUrl = 'https://landregistry.data.gov.uk/landregistry/query';
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}`;
    hideWarning(3);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/sparql-results+json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const bindings = data.results.bindings;
        if (bindings.length === 0) throw new Error("No data found");
        const total = bindings.reduce((acc, curr) => acc + parseInt(curr.amount.value), 0);
        const average = total / bindings.length;
        return Math.round(average / 1000) * 1000;
    } catch (error) {
        showWarning(3, "We couldn't fetch live market data, so we've provided a local estimate.");
        const postcodePrefix = postcode.charAt(0);
        const beds = parseInt(elements.bedrooms.value) || 2;
        let basePrice = 250000;
        if (['L', 'M', 'B', 'S', 'N', 'G'].includes(postcodePrefix)) basePrice = 180000;
        else if (['W', 'E'].includes(postcodePrefix) || postcode.startsWith('SW') || postcode.startsWith('SE')) basePrice = 450000;
        basePrice += ((beds - 2) * 35000);
        return Math.max(50000, Math.round(basePrice / 1000) * 1000);
    }
};
window.calculateStampDuty = (price, region, homeType, isFTB) => {
    if (price <= 0) return 0;
    const regionBrackets = TAX_BRACKETS[region] || TAX_BRACKETS.EN;
    const isAdditional = homeType === 'second';
    let tax = 0;
    if (isFTB && !isAdditional) {
        if (region === 'EN' && price <= 500000) {
            return calculateTieredTax(price, regionBrackets.ftb);
        }
        if (region === 'SC') {
            const standardTax = calculateTieredTax(price, regionBrackets.standard);
            return Math.max(0, standardTax - regionBrackets.ftbRelief);
        }
    }
    tax = calculateTieredTax(price, regionBrackets.standard);
    if (isAdditional && price >= 40000) {
        tax += price * regionBrackets.additionalSurcharge;
    }
    return Math.floor(tax);
};
window.calculateEquityDetails = () => {
    const propertyPrice = appData.propertyPrice;
    let depositPercentage = appData.depositPercentage;
    if (depositPercentage > 100) {
        depositPercentage = 100;
        appData.depositPercentage = 100;
        elements.depositPercentage.value = 100;
    } else if (depositPercentage < 0) {
        depositPercentage = 0;
        appData.depositPercentage = 0;
        elements.depositPercentage.value = 0;
    }
    if (isNaN(propertyPrice) || propertyPrice <= 0) return;
    appData.totalEquity = propertyPrice * (depositPercentage / 100);
    appData.mortgageRequired = propertyPrice - appData.totalEquity;
    const sdlt = calculateStampDuty(propertyPrice, appData.regionCode, appData.homeType, appData.isFTB);
    let legalFees = 1200;
    if (propertyPrice > 500000) legalFees = 1800;
    if (propertyPrice > 1000000) legalFees = 2500;
    const sdltEl = elements.sdltEstimate;
    const legalEl = elements.legalFeesEstimate;
    if (sdltEl) sdltEl.value = sdlt.toLocaleString();
    if (legalEl) legalEl.value = legalFees.toLocaleString();
    if (appData.depositSplitProportional) {
        appData.equityP1 = appData.totalEquity * appData.ratioP1;
        appData.equityP2 = appData.totalEquity * appData.ratioP2;
    } else {
        appData.equityP1 = appData.totalEquity * 0.5;
        appData.equityP2 = appData.totalEquity * 0.5;
    }
    elements.totalEquityDisplay.innerText = formatCurrency(appData.totalEquity);
    elements.mortgageRequiredDisplay.innerText = formatCurrency(appData.mortgageRequired);
    elements.equityP1Display.innerText = formatCurrency(appData.equityP1);
    elements.equityP2Display.innerText = formatCurrency(appData.equityP2);
    calculateMonthlyMortgage();
};
window.calculateMonthlyMortgage = () => {
    const principal = appData.mortgageRequired;
    const annualRate = appData.mortgageInterestRate;
    const termYears = appData.mortgageTerm;
    if (isNaN(principal) || principal <= 0 || isNaN(annualRate) || annualRate <= 0 || isNaN(termYears) || termYears <= 0) {
        appData.monthlyMortgagePayment = 0;
        appData.totalRepayment = 0;
        if (elements.monthlyMortgageDisplay) elements.monthlyMortgageDisplay.innerText = formatCurrency(0);
        if (elements.totalRepaymentDisplay) elements.totalRepaymentDisplay.innerText = formatCurrency(0);
        return;
    }
    const monthlyRate = (annualRate / 100) / 12;
    const numberOfPayments = termYears * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    appData.monthlyMortgagePayment = monthlyPayment;
    appData.totalRepayment = monthlyPayment * numberOfPayments;

    if (elements.monthlyMortgageDisplay) elements.monthlyMortgageDisplay.innerText = formatCurrency(monthlyPayment);
    if (elements.totalRepaymentDisplay) elements.totalRepaymentDisplay.innerText = formatCurrency(appData.totalRepayment);
};
window.updatePricePreview = (band) => {
    appData.band = band;
    const cost = bandPrices[band];
    const display = elements.bandPriceDisplay;
    if (display) {
        display.outerHTML = createAlertHTML('info', 'icon-info.svg', `Band ${band} selected. Estimated cost: ${formatCurrency(cost)} per month.`, 'band-price-display');
        // Re-cache element after outerHTML replacement
        elements.bandPriceDisplay = document.getElementById('band-price-display');
    }
};
window.updateRatioBar = () => {
    const p1P = Math.round(appData.ratioP1 * 100);
    const p2P = Math.round(appData.ratioP2 * 100);
    elements.barP1.style.width = p1P + '%';
    elements.barP1.innerText = p1P + '%';
    elements.barP2.style.width = p2P + '%';
    elements.barP2.innerText = p2P + '%';
    elements.ratioTextDesc.innerText = `Income ratio is ${p1P}% You and ${p2P}% Your Partner.`;
};
window.estimateWaterCost = (postcode, bathrooms) => {
    const regionKey = getRegionFromPostcode(postcode);
    let baseCost = 50;
    if (regionKey && REGIONS[regionKey]) {
        baseCost = REGIONS[regionKey].cost;
    }
    return baseCost + (Math.max(0, bathrooms - 1) * 5);
};
window.populateEstimates = () => {
    elements.councilTaxCost.value = bandPrices[appData.band];
    let energy = 40 + (appData.beds * 25) + (appData.baths * 15);
    if (appData.isNorth) energy *= 1.1;
    if (['E','F','G','H'].includes(appData.band)) energy *= 1.15;
    elements.energyCost.value = Math.round(energy);
    elements.waterBill.value = Math.round(estimateWaterCost(appData.postcode, appData.baths));
    appData.waterBill = getVal('waterBill');
    appData.mortgageInterestRate = getVal('mortgageInterestRate');
    appData.mortgageTerm = getVal('mortgageTerm');
    calculateMonthlyMortgage();
};
window.hideWarning = (screenNum) => {
    const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
    if (warnDiv) warnDiv.setAttribute('hidden', '');
};
window.showWarning = (screenNum, msg) => {
    const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
    if (!warnDiv) return;
    warnDiv.outerHTML = createAlertHTML('warning', 'icon-error.svg', msg, `warning-screen-${screenNum}`);
};
window.updatePagination = (screenId) => {
    const backButton = elements.backButton;
    const nextButton = elements.nextButton;
    const screenConfig = {
        [SCREENS.LANDING]: { back: null, next: () => switchScreen(SCREENS.INCOME), nextText: 'Get Started' },
        [SCREENS.INCOME]: { back: () => switchScreen(SCREENS.LANDING), next: () => validateAndNext(SCREENS.INCOME) },
        [SCREENS.PROPERTY]: { back: () => switchScreen(SCREENS.INCOME), next: () => validateAndNext(SCREENS.PROPERTY) },
        [SCREENS.MORTGAGE]: { back: () => switchScreen(SCREENS.PROPERTY), next: () => validateAndNext(SCREENS.MORTGAGE) },
        [SCREENS.UTILITIES]: { back: () => switchScreen(SCREENS.MORTGAGE), next: () => validateAndNext(SCREENS.UTILITIES) },
        [SCREENS.COMMITTED]: { back: () => switchScreen(SCREENS.UTILITIES), next: () => validateAndNext(SCREENS.COMMITTED), nextText: 'Calculate' },
        [SCREENS.RESULTS]: { back: () => switchScreen(SCREENS.COMMITTED), next: clearCacheAndReload, nextText: 'Start Over' }
    };
    const config = screenConfig[screenId];
    if (!config) return;
    if (config.back) {
        backButton.onclick = config.back;
        backButton.style.display = 'block';
    } else {
        backButton.style.display = 'none';
    }
    if (config.next) {
        nextButton.onclick = config.next;
        nextButton.innerText = config.nextText || 'Next';
        nextButton.style.display = 'block';
    } else {
        nextButton.style.display = 'none';
    }
};
window.switchScreen = (id) => {
    saveToCache();
    const target = document.getElementById(id);
    const heading = target.querySelector('h2');

    // Update URL hash with page-title anchor
    if (heading && heading.id) {
        window.location.hash = heading.id;
    } else {
        window.location.hash = id;
    }

    document.querySelectorAll('main section').forEach(el => el.setAttribute('hidden', ''));
    target.removeAttribute('hidden');
    if (heading) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    target.focus();
    const progressMap = {
        [SCREENS.LANDING]: { p: 0, text: 'Step 1 of 7: Welcome' },
        [SCREENS.INCOME]: { p: 15, text: 'Step 2 of 7: Income' },
        [SCREENS.PROPERTY]: { p: 30, text: 'Step 3 of 7: Property' },
        [SCREENS.MORTGAGE]: { p: 45, text: 'Step 4 of 7: Mortgage & Equity' },
        [SCREENS.UTILITIES]: { p: 60, text: 'Step 5 of 7: Utilities' },
        [SCREENS.COMMITTED]: { p: 80, text: 'Step 6 of 7: Committed Spending' },
        [SCREENS.RESULTS]: { p: 100, text: 'Step 7 of 7: Results' }
    };
    const stepData = progressMap[id] || { p: 0, text: '' };
    const progressBar = elements.progressBar;
    const progressLabel = elements.progressLabel;
    if (progressBar) {
        progressBar.style.width = `${stepData.p}%`;
        progressBar.setAttribute('aria-valuenow', stepData.p);
        progressBar.setAttribute('aria-valuetext', stepData.text);
    }
    if (progressLabel) {
        progressLabel.innerText = stepData.text;
    }
    if (id === SCREENS.PROPERTY) hideWarning(3);
    if (id === SCREENS.UTILITIES || id === SCREENS.RESULTS) updateRatioBar();
    const logo = elements.headerBrand.querySelector('img');
    if (id === SCREENS.LANDING) {
        logo.removeAttribute('hidden');
        elements.headerBrand.style.marginBottom = '2rem';
    } else {
        logo.setAttribute('hidden', '');
        elements.headerBrand.style.marginBottom = '3rem';
    }
    if (id === SCREENS.MORTGAGE) {
        const propPrice = parseFloat(elements.propertyPrice.value) || 0;
        appData.propertyPrice = propPrice;
        const displayField = elements.displayPropertyPrice;
        if (displayField) {
            displayField.value = propPrice.toLocaleString();
        }
        calculateEquityDetails();
    }
    updatePagination(id);
};
window.clearCacheAndReload = () => {
    localStorage.removeItem(CACHE_KEY);
    location.reload();
};
window.calculateFinalSplit = () => {
    const taxVal = getVal('councilTaxCost');
    const enVal = getVal('energyCost');
    const wtVal = getVal('waterBill');
    const bbVal = getVal('broadbandCost');
    const grVal = getVal('groceriesCost');
    const ccVal = getVal('childcareCost');
    const isVal = getVal('insuranceCost');
    const osVal = getVal('otherSharedCosts');
    const mortgage = appData.monthlyMortgagePayment;

    const getSplit = (key, val) => {
        const pref = document.querySelector(`input[name="${key}SplitType"]:checked`)?.value || 'yes';
        const r = pref === 'yes' ? appData.ratioP1 : 0.5;
        return { p1: val * r, p2: val * (1 - r) };
    };

    const tax = getSplit('councilTax', taxVal);
    const energy = getSplit('energy', enVal);
    const water = getSplit('water', wtVal);
    const broadband = getSplit('broadband', bbVal);
    const groceries = getSplit('groceries', grVal);
    const childcare = getSplit('childcare', ccVal);
    const insurance = getSplit('insurance', isVal);
    const otherShared = getSplit('otherShared', osVal);

    const mort = { p1: mortgage * appData.ratioP1, p2: mortgage * appData.ratioP2 };

    const committedTotal = ccVal + isVal + osVal;
    const committedP1 = childcare.p1 + insurance.p1 + otherShared.p1;
    const committedP2 = childcare.p2 + insurance.p2 + otherShared.p2;

    const totalP1 = tax.p1 + energy.p1 + water.p1 + broadband.p1 + groceries.p1 + committedP1 + mort.p1;
    const totalP2 = tax.p2 + energy.p2 + water.p2 + broadband.p2 + groceries.p2 + committedP2 + mort.p2;
    const total = totalP1 + totalP2;

    elements.resultP1.innerText = formatCurrency(totalP1, 2);
    elements.resultP2.innerText = formatCurrency(totalP2, 2);
    elements.totalBillDisplay.innerText = formatCurrency(total, 2);

    updateBreakdownRow('Mortgage', mortgage, mort.p1, mort.p2);
    updateBreakdownRow('Tax', taxVal, tax.p1, tax.p2);
    updateBreakdownRow('Energy', enVal, energy.p1, energy.p2);
    updateBreakdownRow('Water', wtVal, water.p1, water.p2);
    updateBreakdownRow('Broadband', bbVal, broadband.p1, broadband.p2);
    updateBreakdownRow('Groceries', grVal, groceries.p1, groceries.p2);
    updateBreakdownRow('Committed', committedTotal, committedP1, committedP2);
    updateBreakdownRow('Total', total, totalP1, totalP2);

    const summaryEl = elements.resultSummary;
    const summaryText = summaryEl?.querySelector('.alert__text');
    if (summaryEl && summaryText) {
        const diff = Math.abs(totalP1 - totalP2);
        const moreP = totalP1 > totalP2 ? 'You' : 'Your Partner';
        const lessP = totalP1 > totalP2 ? 'Your Partner' : 'You';
        const verb = moreP === 'You' ? 'pay' : 'pays';
        summaryEl.removeAttribute('hidden');
        if (diff < 0.01) summaryText.innerText = "Both partners contribute equally based on your selected split rules.";
        else summaryText.innerText = `${moreP} ${verb} ${formatCurrency(diff, 2)} more than ${lessP} per month overall.`;
    }

    // Update Calculation Workings placeholders
    if (elements.wkSalaryP1) elements.wkSalaryP1.innerText = formatCurrency(appData.salaryP1);
    if (elements.wkSalaryP2) elements.wkSalaryP2.innerText = formatCurrency(appData.salaryP2);
    if (elements.wkTotalSalary) elements.wkTotalSalary.innerText = formatCurrency(appData.salaryP1 + appData.salaryP2);
    if (elements.wkP1Perc) elements.wkP1Perc.innerText = (appData.ratioP1 * 100).toFixed(1) + '%';
    if (elements.wkP2Perc) elements.wkP2Perc.innerText = (appData.ratioP2 * 100).toFixed(1) + '%';

    if (elements.wkPropertyPrice) elements.wkPropertyPrice.innerText = formatCurrency(appData.propertyPrice);
    if (elements.wkDepositPerc) elements.wkDepositPerc.innerText = appData.depositPercentage + '%';
    if (elements.wkTotalEquity) elements.wkTotalEquity.innerText = formatCurrency(appData.totalEquity);
    if (elements.wkDepositSplitType) elements.wkDepositSplitType.innerText = appData.depositSplitProportional ? 'Income Ratio' : '50/50';
    if (elements.wkMortgageRequired) elements.wkMortgageRequired.innerText = formatCurrency(appData.mortgageRequired);
    if (elements.wkInterestRate) elements.wkInterestRate.innerText = appData.mortgageInterestRate + '%';
    if (elements.wkMortgageTerm) elements.wkMortgageTerm.innerText = appData.mortgageTerm;
    if (elements.wkMonthlyPayment) elements.wkMonthlyPayment.innerText = formatCurrency(appData.monthlyMortgagePayment, 2);
    if (elements.wkTotalRepayment) elements.wkTotalRepayment.innerText = formatCurrency(appData.totalRepayment, 2);

    const breakdownSummaryEl = elements.breakdownSummary;
    if (breakdownSummaryEl) {
        const mainCosts = mort.p1 + mort.p2 + taxVal + enVal + wtVal;
        const lifestyleCosts = bbVal + grVal + committedTotal;
        breakdownSummaryEl.innerText = `Out of the £${total.toLocaleString('en-GB', {minimumFractionDigits: 2})} total monthly spend, £${mainCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} is dedicated to the property and utilities, while £${lifestyleCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} covers shared lifestyle and committed costs. This report captures all your shared commitments in one place.`;
    }

    window.switchScreen('screen-7');
};
const VALIDATION_CONFIG = {
    [SCREENS.INCOME]: {
        fields: [
            { id: 'salaryP1', errorId: 'salaryP1Error', type: 'number', min: 0.01, saveTo: 'salaryP1' },
            { id: 'salaryP2', errorId: 'salaryP2Error', type: 'number', min: 0.01, saveTo: 'salaryP2' }
        ],
        nextScreen: SCREENS.PROPERTY,
        onSuccess: () => {
            const total = appData.salaryP1 + appData.salaryP2;
            if (total > 0) {
                appData.ratioP1 = appData.salaryP1 / total;
                appData.ratioP2 = appData.salaryP2 / total;
            }
        }
    },
    [SCREENS.PROPERTY]: {
        fields: [
            { id: 'bedrooms', errorId: 'bedroomsError', type: 'number', min: 1, saveTo: 'beds' },
            { id: 'bathrooms', errorId: 'bathroomsError', type: 'number', min: 1, saveTo: 'baths' }
        ],
        nextScreen: SCREENS.MORTGAGE,
        preValidation: async () => {
            const propPriceInput = elements.propertyPrice;
            const postcodeField = elements.postcode;
            const priceError = elements.propertyPriceError;
            const postcodeError = elements.postcodeError;
            priceError.setAttribute('hidden', '');
            postcodeError.setAttribute('hidden', '');
            let propertyPrice = getVal('propertyPrice');
            if (propertyPrice <= 0) {
                const postcode = postcodeField.value.trim().toUpperCase();
                if (!postcode || !isValidPostcode(postcode)) {
                    if (!postcode) postcodeError.removeAttribute('hidden');
                    priceError.removeAttribute('hidden');
                    return false;
                } else {
                    propertyPrice = await getEstimatedPropertyPrice(postcode);
                    propPriceInput.value = propertyPrice;
                    updatePropertyPriceDisplay(propertyPrice, true);
                }
            } else {
                updatePropertyPriceDisplay(propertyPrice, false);
            }
            appData.propertyPrice = propertyPrice;
            return true;
        },
        globalCheck: () => {
            if (!appData.band) {
                elements.taxBandError.removeAttribute('hidden');
                return false;
            }
            return true;
        },
        onSuccess: () => {
            updateRatioBar();
            populateEstimates();
        }
    },
    [SCREENS.MORTGAGE]: {
        fields: [
            { id: 'depositPercentage', errorId: 'depositPercentageError', type: 'number', min: 0, max: 100 },
            { id: 'mortgageInterestRate', errorId: 'mortgageInterestRateError', type: 'number', min: 0, saveTo: 'mortgageInterestRate' },
            { id: 'mortgageTerm', errorId: 'mortgageTermError', type: 'number', min: 1, max: 50, saveTo: 'mortgageTerm' }
        ],
        nextScreen: SCREENS.UTILITIES,
        onSuccess: calculateMonthlyMortgage
    },
    [SCREENS.UTILITIES]: {
        fields: [
            { id: 'councilTaxCost', errorId: 'councilTaxCostError', type: 'number', min: 0, saveTo: 'councilTaxCost' },
            { id: 'energyCost', errorId: 'energyCostError', type: 'number', min: 0, saveTo: 'energyCost' },
            { id: 'waterBill', errorId: 'waterBillError', type: 'number', min: 0, saveTo: 'waterBill' },
            { id: 'broadbandCost', errorId: 'broadbandError', type: 'number', min: 0, saveTo: 'broadbandCost' }
        ],
        nextScreen: SCREENS.COMMITTED
    },
    [SCREENS.COMMITTED]: {
        fields: [
            { id: 'groceriesCost', errorId: 'groceriesError', type: 'number', min: 0, allowEmpty: true, saveTo: 'groceriesCost' },
            { id: 'childcareCost', errorId: 'childcareError', type: 'number', min: 0, allowEmpty: true, saveTo: 'childcareCost' },
            { id: 'insuranceCost', errorId: 'insuranceError', type: 'number', min: 0, allowEmpty: true, saveTo: 'insuranceCost' },
            { id: 'otherSharedCosts', errorId: 'otherError', type: 'number', min: 0, allowEmpty: true, saveTo: 'otherSharedCosts' }
        ],
        nextScreen: SCREENS.RESULTS,
        onSuccess: window.calculateFinalSplit
    }
};
window.VALIDATION_CONFIG = VALIDATION_CONFIG;
window.validateAndNext = async (screenId) => {
    const config = VALIDATION_CONFIG[screenId];
    if (!config) return;
    let isValid = true;
    if (config.preValidation) {
        if (!await config.preValidation()) isValid = false;
    }
    config.fields.forEach(field => {
        const el = elements[field.id];
        const errorEl = elements[field.errorId];
        if (errorEl) errorEl.setAttribute('hidden', '');
        let val = el.value;
        let fieldValid = true;
        if (field.type === 'number') {
            const numVal = getVal(field.id);
            if (field.allowEmpty && el.value === '') {
                val = 0;
            } else if (isNaN(numVal) || (field.min !== undefined && numVal < field.min) || (field.max !== undefined && numVal > field.max)) {
                fieldValid = false;
            } else {
                val = numVal;
            }
        } else if (field.required && !val.trim()) {
            fieldValid = false;
        }
        if (!fieldValid) {
            if (errorEl) errorEl.removeAttribute('hidden');
            isValid = false;
        } else if (field.saveTo) {
            appData[field.saveTo] = val;
        }
    });
    if (config.globalCheck && !config.globalCheck()) {
        isValid = false;
    }
    if (isValid) {
        if (config.onSuccess) config.onSuccess();
        window.switchScreen(config.nextScreen);
    }
};


document.addEventListener('DOMContentLoaded', () => {
    // Lazy Loader Logic - Wait for fonts to be ready to avoid FOUT
    const loader = document.querySelector('.lazy-loader');
    if (loader) {
        if (document.fonts) {
            document.fonts.ready.then(() => {
                loader.setAttribute('hidden', '');
            }).catch(() => {
                // Fallback in case of error
                loader.setAttribute('hidden', '');
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                loader.setAttribute('hidden', '');
            }, 500);
        }
    }
    // DOM Elements Cache
    elements.salaryP1 = document.getElementById('salaryP1');
    elements.salaryP2 = document.getElementById('salaryP2');
    elements.postcode = document.getElementById('postcode');
    elements.propertyPrice = document.getElementById('propertyPrice');
    elements.bedrooms = document.getElementById('bedrooms');
    elements.bathrooms = document.getElementById('bathrooms');
    elements.councilTaxCost = document.getElementById('councilTaxCost');
    elements.energyCost = document.getElementById('energyCost');
    elements.waterBill = document.getElementById('waterBill');
    elements.broadbandCost = document.getElementById('broadbandCost');
    elements.groceriesCost = document.getElementById('groceriesCost');
    elements.childcareCost = document.getElementById('childcareCost');
    elements.insuranceCost = document.getElementById('insuranceCost');
    elements.otherSharedCosts = document.getElementById('otherSharedCosts');
    elements.depositPercentage = document.getElementById('depositPercentage');
    elements.mortgageInterestRate = document.getElementById('mortgageInterestRate');
    elements.mortgageTerm = document.getElementById('mortgageTerm');
    elements.estimatePriceBtn = document.getElementById('estimatePriceBtn');
    elements.backButton = document.getElementById('back-button');
    elements.nextButton = document.getElementById('next-button');
    elements.progressBar = document.querySelector('.progress__bar');
    elements.progressLabel = document.querySelector('.progress__text');
    elements.propertyPriceDisplay = document.getElementById('propertyPrice-estimate-display');
    elements.estimatedPriceValue = document.getElementById('estimatedPriceValue');
    elements.postcodeError = document.getElementById('postcode-error');
    elements.regionAnnouncement = document.getElementById('region-announcement');
    elements.sdltEstimate = document.getElementById('sdlt-estimate');
    elements.legalFeesEstimate = document.getElementById('legal-fees-estimate');
    elements.totalEquityDisplay = document.getElementById('totalEquityDisplay');
    elements.mortgageRequiredDisplay = document.getElementById('mortgageRequiredDisplay');
    elements.monthlyMortgageDisplay = document.getElementById('monthlyMortgageDisplay');
    elements.totalRepaymentDisplay = document.getElementById('totalRepaymentDisplay');
    elements.equityP1Display = document.getElementById('equityP1Display');
    elements.equityP2Display = document.getElementById('equityP2Display');
    elements.bandPriceDisplay = document.getElementById('band-price-display');
    elements.barP1 = document.getElementById('bar-p1');
    elements.barP2 = document.getElementById('bar-p2');
    elements.ratioTextDesc = document.getElementById('ratio-text-desc');
    elements.resultsTable = document.getElementById('results-table');
    elements.displayPropertyPrice = document.getElementById('displayPropertyPrice');
    elements.headerBrand = document.getElementById('header-brand');
    elements.salaryP1Error = document.getElementById('salaryP1-error');
    elements.salaryP2Error = document.getElementById('salaryP2-error');
    elements.taxBandError = document.getElementById('taxBand-error');
    elements.propertyPriceError = document.getElementById('propertyPrice-error');
    elements.bedroomsError = document.getElementById('bedrooms-error');
    elements.bathroomsError = document.getElementById('bathrooms-error');
    elements.depositPercentageError = document.getElementById('depositPercentage-error');
    elements.mortgageInterestRateError = document.getElementById('mortgageInterestRate-error');
    elements.mortgageTermError = document.getElementById('mortgageTerm-error');
    elements.councilTaxCostError = document.getElementById('councilTaxCost-error');
    elements.energyCostError = document.getElementById('energyCost-error');
    elements.waterBillError = document.getElementById('waterBill-error');
    elements.broadbandError = document.getElementById('broadband-error');
    elements.groceriesError = document.getElementById('groceries-error');
    elements.childcareError = document.getElementById('childcare-error');
    elements.insuranceError = document.getElementById('insurance-error');
    elements.otherError = document.getElementById('other-error');
    elements.resultP1 = document.getElementById('result-p1');
    elements.resultP2 = document.getElementById('result-p2');
    elements.totalBillDisplay = document.getElementById('total-bill-display');
    elements.resultSummary = document.getElementById('result-summary');
    elements.calculationWorkings = document.getElementById('calculation-workings');
    elements.breakdownSummary = document.getElementById('breakdown-summary');
    elements.bdMortgageTotal = document.getElementById('bd-mortgage-total');
    elements.bdMortgageP1 = document.getElementById('bd-mortgage-p1');
    elements.bdMortgageP2 = document.getElementById('bd-mortgage-p2');
    elements.bdTaxTotal = document.getElementById('bd-tax-total');
    elements.bdTaxP1 = document.getElementById('bd-tax-p1');
    elements.bdTaxP2 = document.getElementById('bd-tax-p2');
    elements.bdEnergyTotal = document.getElementById('bd-energy-total');
    elements.bdEnergyP1 = document.getElementById('bd-energy-p1');
    elements.bdEnergyP2 = document.getElementById('bd-energy-p2');
    elements.bdWaterTotal = document.getElementById('bd-water-total');
    elements.bdWaterP1 = document.getElementById('bd-water-p1');
    elements.bdWaterP2 = document.getElementById('bd-water-p2');
    elements.bdBroadbandTotal = document.getElementById('bd-broadband-total');
    elements.bdBroadbandP1 = document.getElementById('bd-broadband-p1');
    elements.bdBroadbandP2 = document.getElementById('bd-broadband-p2');
    elements.bdGroceriesTotal = document.getElementById('bd-groceries-total');
    elements.bdGroceriesP1 = document.getElementById('bd-groceries-p1');
    elements.bdGroceriesP2 = document.getElementById('bd-groceries-p2');
    elements.bdCommittedTotal = document.getElementById('bd-committed-total');
    elements.bdCommittedP1 = document.getElementById('bd-committed-p1');
    elements.bdCommittedP2 = document.getElementById('bd-committed-p2');
    elements.bdTotalTotal = document.getElementById('bd-total-total');
    elements.bdTotalP1 = document.getElementById('bd-total-p1');
    elements.bdTotalP2 = document.getElementById('bd-total-p2');

    // Workings elements
    elements.wkSalaryP1 = document.getElementById('wk-salary-p1');
    elements.wkSalaryP2 = document.getElementById('wk-salary-p2');
    elements.wkTotalSalary = document.getElementById('wk-total-salary');
    elements.wkP1Perc = document.getElementById('wk-p1-perc');
    elements.wkP2Perc = document.getElementById('wk-p2-perc');
    elements.wkPropertyPrice = document.getElementById('wk-property-price');
    elements.wkDepositPerc = document.getElementById('wk-deposit-perc');
    elements.wkTotalEquity = document.getElementById('wk-total-equity');
    elements.wkDepositSplitType = document.getElementById('wk-deposit-split-type');
    elements.wkMortgageRequired = document.getElementById('wk-mortgage-required');
    elements.wkInterestRate = document.getElementById('wk-interest-rate');
    elements.wkMortgageTerm = document.getElementById('wk-mortgage-term');
    elements.wkMonthlyPayment = document.getElementById('wk-monthly-payment');
    elements.wkTotalRepayment = document.getElementById('wk-total-repayment');

    window.addEventListener('online', window.updateOnlineStatus);
    window.addEventListener('offline', window.updateOnlineStatus);
    window.updateOnlineStatus();

    FORM_FIELDS.forEach(field => {
        const el = elements[field.id];
        if (!el) return;
        el.addEventListener('input', () => {
            if (field.id === 'postcode') formatPostcode(el);
            let val = el.value;
            if (field.type === 'number') val = parseFloat(val) || 0;
            appData[field.key || field.id] = val;
            if (field.id === 'propertyPrice') updatePropertyPriceDisplay(val, false);
            if (field.id === 'depositPercentage') calculateEquityDetails();
            if (field.id === 'mortgageInterestRate' || field.id === 'mortgageTerm') calculateMonthlyMortgage();
            saveToCache();
        });
    });

    const estimatePriceBtn = elements.estimatePriceBtn;
    if (estimatePriceBtn) {
        estimatePriceBtn.addEventListener('click', async () => {
            const postcodeField = elements.postcode;
            const postcode = postcodeField.value.trim().toUpperCase();
            if (!postcode || !isValidPostcode(postcode)) { return; }
            const estimatedPrice = await getEstimatedPropertyPrice(postcode);
            elements.propertyPrice.value = estimatedPrice;
            appData.propertyPrice = estimatedPrice;
            updatePropertyPriceDisplay(estimatedPrice, true);
            saveToCache();
        });
    }

    document.querySelectorAll('input[name="depositSplitType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            appData.depositSplitProportional = radio.value === 'yes';
            calculateEquityDetails();
            saveToCache();
        });
    });

    const ftbContainer = document.getElementById('ftb-container');
    function updateFTBVisibility() {
        if (!ftbContainer) return;
        if (appData.homeType === 'first') {
            ftbContainer.removeAttribute('hidden');
        } else {
            ftbContainer.setAttribute('hidden', '');
        }
    }
    document.querySelectorAll('input[name="homeType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            appData.homeType = radio.value;
            updateFTBVisibility();
            calculateEquityDetails();
            saveToCache();
        });
    });

    document.querySelectorAll('input[name="buyerStatus"]').forEach(radio => {
        radio.addEventListener('change', () => {
            appData.isFTB = radio.value === 'ftb';
            calculateEquityDetails();
            saveToCache();
        });
    });

    document.querySelectorAll('main section').forEach(el => el.setAttribute('hidden', ''));
    const progressBar = elements.progressBar;
    if (progressBar) progressBar.style.width = '0%';
    loadFromCache();
    calculateEquityDetails();
    calculateMonthlyMortgage();
    window.switchScreen(SCREENS.LANDING);

    document.addEventListener('keydown', (e) => {
        const visibleScreen = document.querySelector('main section:not([hidden])');
        if (!visibleScreen) return;
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            elements.nextButton.click();
        } else if (e.key === 'ArrowLeft') {
            elements.backButton.click();
        }
    });
});
