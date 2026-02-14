document.addEventListener('DOMContentLoaded', () => {
    // Lazy Loader Logic
    const loader = document.querySelector('.lazy-loader');
    if (loader) {
        setTimeout(() => {
            loader.setAttribute('hidden', '');
        }, 500);
    }

    // Application Data
    const appData = {
        salaryHis: 0,
        salaryHer: 0,
        ratioHis: 0.5,
        ratioHer: 0.5,
        propertyPrice: 0,
        depositPercentage: 0,
        depositSplitProportional: true,
        totalEquity: 0,
        mortgageRequired: 0,
        equityHis: 0,
        equityHer: 0,
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
        band: '',
        beds: 0,
        baths: 0,
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

    const bandPrices = { 'A': 110, 'B': 128, 'C': 146, 'D': 165, 'E': 201, 'F': 238, 'G': 275, 'H': 330 };
    const CACHE_KEY = 'his_and_hers_cache';

    // --- Core Functions ---

    function saveToCache() {
        const splitPrefs = {};
        Object.keys(appData.splitTypes).forEach(key => {
            const radio = document.querySelector(`input[name="${key}SplitType"]:checked`);
            if (radio) {
                splitPrefs[`${key}SplitType`] = radio.value;
            }
        });

        const inputs = {
            salaryHis: document.getElementById('salaryHis').value,
            salaryHer: document.getElementById('salaryHer').value,
            postcode: document.getElementById('postcode').value,
            propertyPrice: document.getElementById('propertyPrice').value,
            taxBand: document.querySelector('input[name="taxBand"]:checked')?.value,
            bedrooms: document.getElementById('bedrooms').value,
            bathrooms: document.getElementById('bathrooms').value,
            councilTaxCost: document.getElementById('councilTaxCost').value,
            energyCost: document.getElementById('energyCost').value,
            waterBill: document.getElementById('waterBill').value,
            broadbandCost: document.getElementById('broadbandCost').value,
            groceriesCost: document.getElementById('groceriesCost').value,
            childcareCost: document.getElementById('childcareCost').value,
            insuranceCost: document.getElementById('insuranceCost').value,
            otherSharedCosts: document.getElementById('otherSharedCosts').value,
            depositPercentage: document.getElementById('depositPercentage').value,
            depositSplitType: document.querySelector('input[name="depositSplitType"]:checked')?.value,
            mortgageInterestRate: document.getElementById('mortgageInterestRate').value,
            mortgageTerm: document.getElementById('mortgageTerm').value,
            ...splitPrefs
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(inputs));
    }

    function loadFromCache() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;

        const inputs = JSON.parse(cached);
        for (const [id, value] of Object.entries(inputs)) {
            const el = document.getElementById(id);
            if (!el) {
                // Handle radio buttons by name
                if (id.endsWith('SplitType')) {
                    const name = id;
                    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                    
                    const dataKey = name.replace('SplitType', '');
                    if (appData.splitTypes.hasOwnProperty(dataKey)) {
                        appData.splitTypes[dataKey] = value;
                    }
                }
                if (id === 'taxBand' && value) {
                    const radio = document.querySelector(`input[name="taxBand"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                        updatePricePreview(value);
                    }
                }
                if (id === 'depositSplitType' && value) {
                    const radio = document.querySelector(`input[name="depositSplitType"][value="${value}"]`);
                    if (radio) radio.checked = true;
                }
                continue;
            }
            el.value = value;
        }
        
        appData.salaryHis = parseFloat(inputs.salaryHis) || 0;
        appData.salaryHer = parseFloat(inputs.salaryHer) || 0;
        const total = appData.salaryHis + appData.salaryHer;
        if (total > 0) {
            appData.ratioHis = appData.salaryHis / total;
            appData.ratioHer = appData.salaryHer / total;
        }
        appData.postcode = inputs.postcode || '';
        appData.propertyPrice = parseFloat(inputs.propertyPrice) || 0;
        appData.band = inputs.taxBand || '';
        appData.beds = parseInt(inputs.bedrooms) || 0;
        appData.baths = parseInt(inputs.bathrooms) || 0;
        appData.depositSplitProportional = inputs.depositSplitType === 'yes';
        
        if (appData.propertyPrice > 0) {
            updatePropertyPriceDisplay(appData.propertyPrice, false);
        }
        
        checkRegion(); 
    }

    window.setAllSplitTypes = function(screen, type) {
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

    function formatPostcode(input) {
        let value = input.value.replace(/\s+/g, '').toUpperCase();
        if (value.length > 3) {
            const incode = value.slice(-3);
            const outcode = value.slice(0, -3);
            input.value = outcode + ' ' + incode;
        } else {
            input.value = value;
        }
    }

    function updatePropertyPriceDisplay(price, isEstimated) {
        const display = document.getElementById('propertyPrice-estimate-display');
        if (!display) return;

        if (price > 0) {
            const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
            display.innerHTML = `${labelText}<span id="estimatedPriceValue">£${price.toLocaleString()}</span>`;
            display.removeAttribute('hidden');
        } else {
            display.setAttribute('hidden', '');
        }
    }

    function isValidPostcode(postcode) {
        const postcodeRegEx = /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i;
        return postcodeRegEx.test(postcode);
    }

    function checkRegion() {
        const postcodeInput = document.getElementById('postcode');
        formatPostcode(postcodeInput);
        const pc = postcodeInput.value.trim().toUpperCase();

        if (pc.length > 0 && !isValidPostcode(pc)) {
            document.getElementById('postcode-error').removeAttribute('hidden');
            return;
        } else {
            document.getElementById('postcode-error').setAttribute('hidden', '');
        }

        appData.postcode = pc;
        const northernPrefixes = ['G', 'E', 'N', 'L', 'M', 'B', 'S'];
        const prefix = pc.charAt(0);

        const announceDiv = document.getElementById('region-announcement');
        if (northernPrefixes.includes(prefix)) {
            appData.isNorth = true;
            announceDiv.innerText = "Northern region detected. Heating estimates adjusted.";
        } else if (pc.length > 0) {
            appData.isNorth = false;
            announceDiv.innerText = "Region recorded.";
        }
    }

    async function getEstimatedPropertyPrice(postcode) {
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

        hideWarning(2);

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
            showWarning(2, "We couldn't fetch live market data, so we've provided a local estimate.");
            const postcodePrefix = postcode.charAt(0);
            const beds = parseInt(document.getElementById('bedrooms').value) || 2;
            let basePrice = 250000; 
            if (['L', 'M', 'B', 'S', 'N', 'G'].includes(postcodePrefix)) basePrice = 180000; 
            else if (['W', 'E'].includes(postcodePrefix) || postcode.startsWith('SW') || postcode.startsWith('SE')) basePrice = 450000; 
            basePrice += ((beds - 2) * 35000);
            return Math.max(50000, Math.round(basePrice / 1000) * 1000);
        }
    }

    function calculateEquityDetails() {
        const propertyPrice = appData.propertyPrice;
        const depositPercentageInput = document.getElementById('depositPercentage');
        if (!depositPercentageInput) return;

        let depositPercentage = parseFloat(depositPercentageInput.value);
        
        if (depositPercentage > 100) {
            depositPercentage = 100;
            depositPercentageInput.value = 100;
        } else if (depositPercentage < 0) {
            depositPercentage = 0;
            depositPercentageInput.value = 0;
        }

        if (isNaN(propertyPrice) || propertyPrice <= 0) return;

        appData.depositPercentage = isNaN(depositPercentage) ? 0 : depositPercentage;
        appData.totalEquity = propertyPrice * (appData.depositPercentage / 100);
        appData.mortgageRequired = propertyPrice - appData.totalEquity;
        
        const splitType = document.querySelector('input[name="depositSplitType"]:checked')?.value;
        appData.depositSplitProportional = splitType === 'yes';

        if (appData.depositSplitProportional) {
            appData.equityHis = appData.totalEquity * appData.ratioHis;
            appData.equityHer = appData.totalEquity * appData.ratioHer;
        } else {
            appData.equityHis = appData.totalEquity * 0.5;
            appData.equityHer = appData.totalEquity * 0.5;
        }

        document.getElementById('totalEquityDisplay').innerText = `£${appData.totalEquity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        document.getElementById('mortgageRequiredDisplay').innerText = `£${appData.mortgageRequired.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        document.getElementById('equityHisDisplay').innerText = `£${appData.equityHis.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        document.getElementById('equityHerDisplay').innerText = `£${appData.equityHer.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    }

    function calculateMonthlyMortgage() {
        const principal = appData.mortgageRequired;
        const annualRate = parseFloat(document.getElementById('mortgageInterestRate').value);
        const termYears = parseFloat(document.getElementById('mortgageTerm').value);

        if (isNaN(principal) || principal <= 0 || isNaN(annualRate) || annualRate <= 0 || isNaN(termYears) || termYears <= 0) {
            appData.monthlyMortgagePayment = 0;
            return;
        }
        const monthlyRate = (annualRate / 100) / 12;
        const numberOfPayments = termYears * 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        appData.monthlyMortgagePayment = monthlyPayment;
    }

    function updatePricePreview(band) {
        appData.band = band;
        const cost = bandPrices[band];
        const display = document.getElementById('band-price-display');
        display.innerText = `Band ${band} selected. Estimated cost: £${cost} per month.`;
    }

    function updateRatioBar() {
        const hP = Math.round(appData.ratioHis * 100);
        const sP = Math.round(appData.ratioHer * 100);
        document.getElementById('bar-his').style.width = hP + '%';
        document.getElementById('bar-his').innerText = hP + '%';
        document.getElementById('bar-her').style.width = sP + '%';
        document.getElementById('bar-her').innerText = sP + '%';
        document.getElementById('ratio-text-desc').innerText = `Income ratio is ${hP}% Person A and ${sP}% Person B.`;
    }

    function estimateWaterCost(postcode, bathrooms) {
        const pc = postcode.trim().toUpperCase();
        if (!pc) return 30;
        const prefix2 = pc.substring(0, 2);
        const prefix1 = pc.substring(0, 1);
        const regions = {
            NI: { prefixes: ['BT'], cost: 0 },
            SCOTLAND: { prefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'], cost: 42 },
            WALES: { prefixes: ['CF', 'LD', 'LL', 'NP', 'SA', 'SY'], cost: 55 },
            SOUTH_WEST: { prefixes: ['BA', 'BH', 'BS', 'DT', 'EX', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'], cost: 62 },
            SOUTH: { prefixes: ['BN', 'CT', 'GU', 'ME', 'OX', 'PO', 'RG', 'RH', 'SL', 'TN'], cost: 58 },
            LONDON: { prefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD'], cost: 54 },
            EAST: { prefixes: ['AL', 'CB', 'CM', 'CO', 'EN', 'HP', 'IP', 'LU', 'NR', 'RM', 'SG', 'SS'], cost: 52 },
            MIDLANDS: { prefixes: ['B', 'CV', 'DE', 'DY', 'HR', 'LE', 'LN', 'NG', 'NN', 'ST', 'SY', 'TF', 'WR', 'WS', 'WV'], cost: 48 },
            NORTH: { prefixes: ['BB', 'BD', 'BL', 'CA', 'CH', 'CW', 'DH', 'DL', 'DN', 'FY', 'HD', 'HG', 'HU', 'HX', 'L', 'LA', 'LS', 'M', 'NE', 'OL', 'PR', 'S', 'SK', 'SR', 'TS', 'WA', 'WF', 'WN', 'YO'], cost: 45 }
        };
        let baseCost = 50;
        for (const region in regions) {
            if (regions[region].prefixes.some(p => prefix2.startsWith(p) || (p.length === 1 && prefix1 === p))) {
                baseCost = regions[region].cost;
                break;
            }
        }
        return baseCost + (Math.max(0, bathrooms - 1) * 5);
    }

    function populateEstimates() {
        document.getElementById('councilTaxCost').value = bandPrices[appData.band];
        let energy = 40 + (appData.beds * 25) + (appData.baths * 15);
        if (appData.isNorth) energy *= 1.1;
        if (['E','F','G','H'].includes(appData.band)) energy *= 1.15;
        document.getElementById('energyCost').value = Math.round(energy);
        document.getElementById('waterBill').value = Math.round(estimateWaterCost(appData.postcode, appData.baths));
        appData.waterBill = parseFloat(document.getElementById('waterBill').value) || 0;
        appData.mortgageInterestRate = parseFloat(document.getElementById('mortgageInterestRate').value) || 0;
        appData.mortgageTerm = parseFloat(document.getElementById('mortgageTerm').value) || 0;
        calculateMonthlyMortgage();
    }

    function hideWarning(screenNum) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (warnDiv) warnDiv.setAttribute('hidden', '');
    }

    function showWarning(screenNum, msg) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (!warnDiv) return;
        warnDiv.innerText = msg;
        warnDiv.removeAttribute('hidden');
    }

    // --- Window Exposed Functions ---

    window.downloadCSV = function() {
        const table = document.getElementById('results-table');
        let csv = [];
        const rows = table.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');
            for (let j = 0; j < cols.length; j++) {
                // Clean currency symbols and commas for CSV
                let data = cols[j].innerText.replace(/£/g, '').replace(/,/g, '');
                row.push('"' + data + '"');
            }
            csv.push(row.join(','));
        }

        const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "HisAndHers_FairShare_Breakdown.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.switchScreen = function(id) {
        saveToCache();
        document.querySelectorAll('main section').forEach(el => el.setAttribute('hidden', ''));
        const target = document.getElementById(id);
        target.removeAttribute('hidden');
        
        // Scroll to the main heading of the new screen
        const heading = target.querySelector('h2');
        if (heading) {
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        target.focus();

        const progressMap = {
            'screen-landing': { p: 0, text: 'Step 1 of 7: Welcome' },
            'screen-1': { p: 15, text: 'Step 2 of 7: Income' },
            'screen-2': { p: 30, text: 'Step 3 of 7: Property' },
            'screen-4': { p: 45, text: 'Step 4 of 7: Mortgage & Equity' },
            'screen-3': { p: 60, text: 'Step 5 of 7: Utilities' },
            'screen-committed': { p: 80, text: 'Step 6 of 7: Committed Spending' },
            'screen-5': { p: 100, text: 'Step 7 of 7: Results' }
        };
        const stepData = progressMap[id] || { p: 0, text: '' };
        const progressBar = document.getElementById('app-progress');
        const progressLabel = document.getElementById('progress-text-alt');
        
        if (progressBar) {
            progressBar.style.width = `${stepData.p}%`;
            progressBar.setAttribute('aria-valuenow', stepData.p);
            progressBar.setAttribute('aria-valuetext', stepData.text);
        }
        if (progressLabel) {
            progressLabel.innerText = stepData.text;
        }

        if (id === 'screen-2') hideWarning(2);
        if (id === 'screen-3' || id === 'screen-5') updateRatioBar();
        if (id === 'screen-4') {
            const propPrice = parseFloat(document.getElementById('propertyPrice').value) || 0;
            appData.propertyPrice = propPrice;
            const displayField = document.getElementById('displayPropertyPrice');
            if (displayField) {
                displayField.value = propPrice.toLocaleString();
            }
            calculateEquityDetails();
        }
    };

    window.clearCacheAndReload = function() {
        localStorage.removeItem(CACHE_KEY);
        document.querySelectorAll('input').forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') input.checked = false;
            else input.value = '';
        });
        const regionAnnounce = document.getElementById('region-announcement');
        if (regionAnnounce) regionAnnounce.innerText = '';
        const priceEstimate = document.getElementById('propertyPrice-estimate-display');
        if (priceEstimate) priceEstimate.setAttribute('hidden', '');
        location.reload();
    };

    window.validateAndNext1 = function() {
        const hInput = document.getElementById('salaryHis');
        const sInput = document.getElementById('salaryHer');
        const hError = document.getElementById('salaryHis-error');
        const sError = document.getElementById('salaryHer-error');
        
        const h = parseFloat(hInput.value);
        const s = parseFloat(sInput.value);
        let isValid = true;

        if (isNaN(h) || h <= 0) { hError.removeAttribute('hidden'); isValid = false; }
        else { hError.setAttribute('hidden', ''); }

        if (isNaN(s) || s <= 0) { sError.removeAttribute('hidden'); isValid = false; }
        else { sError.setAttribute('hidden', ''); }

        if (!isValid) return;
        appData.salaryHis = h; appData.salaryHer = s;
        const total = h + s;
        appData.ratioHis = h / total; appData.ratioHer = s / total;
        switchScreen('screen-2');
    };

    window.checkRegion = checkRegion;
    window.updatePricePreview = updatePricePreview;

    window.validateAndNext2 = async function() {
        const propPriceInput = document.getElementById('propertyPrice');
        const postcodeField = document.getElementById('postcode');
        const taxBandError = document.getElementById('taxBand-error');
        const bedsInput = document.getElementById('bedrooms');
        const bathsInput = document.getElementById('bathrooms');
        const priceError = document.getElementById('propertyPrice-error');
        const postcodeError = document.getElementById('postcode-error');
        const bedsError = document.getElementById('bedrooms-error');
        const bathsError = document.getElementById('bathrooms-error');
        
        let isValid = true;
        taxBandError.setAttribute('hidden', '');
        priceError.setAttribute('hidden', '');
        postcodeError.setAttribute('hidden', '');
        bedsError.setAttribute('hidden', '');
        bathsError.setAttribute('hidden', '');

        let propertyPrice = parseFloat(propPriceInput.value);
        if (isNaN(propertyPrice) || propertyPrice <= 0) {
            const postcode = postcodeField.value.trim().toUpperCase();
            if (!postcode || !isValidPostcode(postcode)) {
                if (!postcode) postcodeError.removeAttribute('hidden');
                priceError.removeAttribute('hidden');
                isValid = false;
            } else {
                propertyPrice = await getEstimatedPropertyPrice(postcode);
                propPriceInput.value = propertyPrice;
                updatePropertyPriceDisplay(propertyPrice, true);
            }
        } else updatePropertyPriceDisplay(propertyPrice, false);

        if (!appData.band) { taxBandError.removeAttribute('hidden'); isValid = false; }
        
        const beds = parseInt(bedsInput.value);
        if (isNaN(beds) || beds < 1) { bedsError.removeAttribute('hidden'); isValid = false; }
        const baths = parseInt(bathsInput.value);
        if (isNaN(baths) || baths < 1) { bathsError.removeAttribute('hidden'); isValid = false; }

        if (!isValid) return;
        appData.propertyPrice = propertyPrice;
        appData.beds = beds;
        appData.baths = baths;
        updateRatioBar();
        populateEstimates();
        switchScreen('screen-4');
    };

    window.validateAndNextMortgage = function() {
        const depositInput = document.getElementById('depositPercentage');
        const rateInput = document.getElementById('mortgageInterestRate');
        const termInput = document.getElementById('mortgageTerm');

        const depError = document.getElementById('depositPercentage-error');
        const rateError = document.getElementById('mortgageInterestRate-error');
        const termError = document.getElementById('mortgageTerm-error');

        let isValid = true;
        [depError, rateError, termError].forEach(e => e.setAttribute('hidden', ''));

        const deposit = parseFloat(depositInput.value);
        if (isNaN(deposit) || deposit < 0 || deposit > 100) { depError.removeAttribute('hidden'); isValid = false; }
        const rate = parseFloat(rateInput.value);
        if (isNaN(rate) || rate < 0) { rateError.removeAttribute('hidden'); isValid = false; }
        const term = parseInt(termInput.value);
        if (isNaN(term) || term < 1 || term > 50) { termError.removeAttribute('hidden'); isValid = false; }
        
        if (!isValid) return;

        appData.mortgageInterestRate = rate;
        appData.mortgageTerm = term;
        calculateMonthlyMortgage();
        switchScreen('screen-3');
    };

    window.validateAndNext3 = function() {
        const taxInput = document.getElementById('councilTaxCost');
        const energyInput = document.getElementById('energyCost');
        const waterInput = document.getElementById('waterBill');
        const broadbandInput = document.getElementById('broadbandCost');
        
        const taxError = document.getElementById('councilTaxCost-error');
        const enError = document.getElementById('energyCost-error');
        const wtError = document.getElementById('waterBill-error');
        const bbError = document.getElementById('broadband-error');

        let isValid = true;
        [taxError, enError, wtError, bbError].forEach(e => e.setAttribute('hidden', ''));

        if (isNaN(parseFloat(taxInput.value)) || parseFloat(taxInput.value) < 0) { taxError.removeAttribute('hidden'); isValid = false; }
        if (isNaN(parseFloat(energyInput.value)) || parseFloat(energyInput.value) < 0) { enError.removeAttribute('hidden'); isValid = false; }
        if (isNaN(parseFloat(waterInput.value)) || parseFloat(waterInput.value) < 0) { wtError.removeAttribute('hidden'); isValid = false; }
        if (isNaN(parseFloat(broadbandInput.value)) || parseFloat(broadbandInput.value) < 0) { bbError.removeAttribute('hidden'); isValid = false; }

        if (!isValid) return;
        appData.broadbandCost = parseFloat(broadbandInput.value) || 0;
        switchScreen('screen-committed');
    };

    window.validateAndNextCommitted = function() {
        const groceries = document.getElementById('groceriesCost');
        const childcare = document.getElementById('childcareCost');
        const insurance = document.getElementById('insuranceCost');
        const other = document.getElementById('otherSharedCosts');

        const grError = document.getElementById('groceries-error');
        const ccError = document.getElementById('childcare-error');
        const isError = document.getElementById('insurance-error');
        const osError = document.getElementById('other-error');

        let isValid = true;
        [grError, ccError, isError, osError].forEach(e => e.setAttribute('hidden', ''));

        if (groceries.value !== '' && (isNaN(parseFloat(groceries.value)) || parseFloat(groceries.value) < 0)) { grError.removeAttribute('hidden'); isValid = false; }
        if (childcare.value !== '' && (isNaN(parseFloat(childcare.value)) || parseFloat(childcare.value) < 0)) { ccError.removeAttribute('hidden'); isValid = false; }
        if (insurance.value !== '' && (isNaN(parseFloat(insurance.value)) || parseFloat(insurance.value) < 0)) { isError.removeAttribute('hidden'); isValid = false; }
        if (other.value !== '' && (isNaN(parseFloat(other.value)) || parseFloat(other.value) < 0)) { osError.removeAttribute('hidden'); isValid = false; }

        if (!isValid) return;
        appData.groceriesCost = parseFloat(groceries.value) || 0;
        appData.childcareCost = parseFloat(childcare.value) || 0;
        appData.insuranceCost = parseFloat(insurance.value) || 0;
        appData.otherSharedCosts = parseFloat(other.value) || 0;
        
        calculateFinalSplit();
    }

    window.calculateFinalSplit = function() {
        const taxVal = parseFloat(document.getElementById('councilTaxCost').value) || 0;
        const enVal = parseFloat(document.getElementById('energyCost').value) || 0;
        const wtVal = parseFloat(document.getElementById('waterBill').value) || 0;
        const bbVal = parseFloat(document.getElementById('broadbandCost').value) || 0;
        const grVal = parseFloat(document.getElementById('groceriesCost').value) || 0;
        const ccVal = parseFloat(document.getElementById('childcareCost').value) || 0;
        const isVal = parseFloat(document.getElementById('insuranceCost').value) || 0;
        const osVal = parseFloat(document.getElementById('otherSharedCosts').value) || 0;
        const mortgage = appData.monthlyMortgagePayment;

        const getSplit = (key, val) => {
            const pref = document.querySelector(`input[name="${key}SplitType"]:checked`)?.value || 'yes';
            const r = pref === 'yes' ? appData.ratioHis : 0.5;
            return { h: val * r, s: val * (1 - r) };
        };

        const tax = getSplit('councilTax', taxVal);
        const energy = getSplit('energy', enVal);
        const water = getSplit('water', wtVal);
        const broadband = getSplit('broadband', bbVal);
        const groceries = getSplit('groceries', grVal);
        const childcare = getSplit('childcare', ccVal);
        const insurance = getSplit('insurance', isVal);
        const otherShared = getSplit('otherShared', osVal);
        
        const mort = { h: mortgage * appData.ratioHis, s: mortgage * appData.ratioHer };

        const committedTotal = ccVal + isVal + osVal;
        const committedH = childcare.h + insurance.h + otherShared.h;
        const committedS = childcare.s + insurance.s + otherShared.s;

        const totalH = tax.h + energy.h + water.h + broadband.h + groceries.h + committedH + mort.h;
        const totalS = tax.s + energy.s + water.s + broadband.s + groceries.s + committedS + mort.s;
        const total = totalH + totalS;

        const fmt = (num) => '£' + num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        document.getElementById('result-his').innerText = fmt(totalH);
        document.getElementById('result-her').innerText = fmt(totalS);
        document.getElementById('total-bill-display').innerText = fmt(total);

        document.getElementById('bd-mortgage-total').innerText = fmt(mortgage);
        document.getElementById('bd-mortgage-his').innerText = fmt(mort.h);
        document.getElementById('bd-mortgage-her').innerText = fmt(mort.s);
        document.getElementById('bd-tax-total').innerText = fmt(taxVal);
        document.getElementById('bd-tax-his').innerText = fmt(tax.h);
        document.getElementById('bd-tax-her').innerText = fmt(tax.s);
        document.getElementById('bd-energy-total').innerText = fmt(enVal);
        document.getElementById('bd-energy-his').innerText = fmt(energy.h);
        document.getElementById('bd-energy-her').innerText = fmt(energy.s);
        document.getElementById('bd-water-total').innerText = fmt(wtVal);
        document.getElementById('bd-water-his').innerText = fmt(water.h);
        document.getElementById('bd-water-her').innerText = fmt(water.s);
        document.getElementById('bd-broadband-total').innerText = fmt(bbVal);
        document.getElementById('bd-broadband-his').innerText = fmt(broadband.h);
        document.getElementById('bd-broadband-her').innerText = fmt(broadband.s);
        document.getElementById('bd-groceries-total').innerText = fmt(grVal);
        document.getElementById('bd-groceries-his').innerText = fmt(groceries.h);
        document.getElementById('bd-groceries-her').innerText = fmt(groceries.s);
        document.getElementById('bd-committed-total').innerText = fmt(committedTotal);
        document.getElementById('bd-committed-his').innerText = fmt(committedH);
        document.getElementById('bd-committed-her').innerText = fmt(committedS);
        document.getElementById('bd-total-total').innerText = fmt(total);
        document.getElementById('bd-total-his').innerText = fmt(totalH);
        document.getElementById('bd-total-her').innerText = fmt(totalS);

        const summaryEl = document.getElementById('result-summary');
        if (summaryEl) {
            const diff = Math.abs(totalH - totalS);
            const moreP = totalH > totalS ? 'Person A' : 'Person B';
            const lessP = totalH > totalS ? 'Person B' : 'Person A';
            if (diff < 0.01) summaryEl.innerText = "Both partners contribute equally based on your selected split rules.";
            else summaryEl.innerText = `${moreP} pays ${fmt(diff)} more than ${lessP} per month overall.`;
        }

        const workingsEl = document.getElementById('calculation-workings');
        if (workingsEl) {
            const totalSalary = appData.salaryHis + appData.salaryHer;
            const hPerc = (appData.ratioHis * 100).toFixed(1);
            const sPerc = (appData.ratioHer * 100).toFixed(1);
            workingsEl.innerHTML = `
                <div>
                    <div><strong>1. Combined Annual Income:</strong> £${appData.salaryHis.toLocaleString()} + £${appData.salaryHer.toLocaleString()} = <strong>£${totalSalary.toLocaleString()}</strong></div>
                    <div><strong>2. Established Fair Share Ratio:</strong>
                        <ul>
                            <li>Person A: £${appData.salaryHis.toLocaleString()} / £${totalSalary.toLocaleString()} = <strong>${hPerc}%</strong></li>
                            <li>Person B: £${appData.salaryHer.toLocaleString()} / £${totalSalary.toLocaleString()} = <strong>${sPerc}%</strong></li>
                        </ul>
                    </div>
                    <div><strong>3. Calculation Application:</strong> Each line item was split using either the <strong>Ratio</strong> above or <strong>50/50</strong> based on your specific rule choices.</div>
                </div>
            `;
        }

        const breakdownSummaryEl = document.getElementById('breakdown-summary');
        if (breakdownSummaryEl) {
            const mainCosts = mort.h + mort.s + taxVal + enVal + wtVal;
            const lifestyleCosts = bbVal + grVal + committedTotal;
            breakdownSummaryEl.innerText = `Out of the £${total.toLocaleString(undefined, {minimumFractionDigits: 2})} total monthly spend, £${mainCosts.toLocaleString(undefined, {minimumFractionDigits: 2})} is dedicated to the property and utilities, while £${lifestyleCosts.toLocaleString(undefined, {minimumFractionDigits: 2})} covers shared lifestyle and committed costs. This report captures all your shared commitments in one place.`;
        }

        switchScreen('screen-5');
    };

    // --- Event Listeners ---

    const postcodeInputElement = document.getElementById('postcode');
    if (postcodeInputElement) {
        postcodeInputElement.addEventListener('input', () => {
            formatPostcode(postcodeInputElement);
            saveToCache();
        });
    }

    const pPriceInput = document.getElementById('propertyPrice');
    if (pPriceInput) {
        pPriceInput.addEventListener('input', () => {
            const val = parseFloat(pPriceInput.value) || 0;
            updatePropertyPriceDisplay(val, false);
            saveToCache();
        });
    }

    const estimatePriceBtn = document.getElementById('estimatePriceBtn');
    if (estimatePriceBtn) {
        estimatePriceBtn.addEventListener('click', async function() {
            const postcodeField = document.getElementById('postcode');
            const postcode = postcodeField.value.trim().toUpperCase();
            if (!postcode || !isValidPostcode(postcode)) { return; }
            const estimatedPrice = await getEstimatedPropertyPrice(postcode);
            document.getElementById('propertyPrice').value = estimatedPrice;
            updatePropertyPriceDisplay(estimatedPrice, true);
            saveToCache();
        });
    }

    const depositPctInput = document.getElementById('depositPercentage');
    if (depositPctInput) {
        depositPctInput.addEventListener('input', () => {
            calculateEquityDetails();
            saveToCache();
        });
    }

    document.querySelectorAll('input[name="depositSplitType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            calculateEquityDetails();
            saveToCache();
        });
    });

    const mortgageRateInput = document.getElementById('mortgageInterestRate');
    if (mortgageRateInput) {
        mortgageRateInput.addEventListener('input', () => {
            calculateMonthlyMortgage();
            saveToCache();
        });
    }

    const mortgageTermInput = document.getElementById('mortgageTerm');
    if (mortgageTermInput) {
        mortgageTermInput.addEventListener('input', () => {
            calculateMonthlyMortgage();
            saveToCache();
        });
    }

    // Initial load: Set hidden states for all sections except landing
    document.querySelectorAll('main section').forEach(el => el.setAttribute('hidden', ''));
    document.getElementById('screen-landing').removeAttribute('hidden');
    const progressBar = document.getElementById('app-progress');
    if (progressBar) progressBar.style.width = '0%';
    loadFromCache();
});