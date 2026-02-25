/**
 * main.js
 * Application entry point and orchestrator.
 */

import State, { INITIAL_STATE } from './core/State.js';
import FinanceEngine from './core/FinanceEngine.js';
import ApiService from './services/ApiService.js';
import UIManager from './ui/UIManager.js';
import { formatCurrency } from './ui/Components.js';

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
    { id: 'depositAmount', type: 'number' },
    { id: 'mortgageInterestRate', type: 'number' },
    { id: 'mortgageTerm', type: 'number' },
    { id: 'mortgageFees', type: 'number' }
];

const BAND_PRICES = { 'A': 110, 'B': 128, 'C': 146, 'D': 165, 'E': 201, 'F': 238, 'G': 275, 'H': 330 };

const app = {
    /**
     * Initializes the application, caches elements, and sets up state/UI managers.
     */
    init() {
        this.hideLoader();
        this.cacheElements();
        this.ui = new UIManager(this.elements, BAND_PRICES);
        this.store = new State(INITIAL_STATE, (data) => this.ui.render(data));
        
        this.store.hydrate();
        this.bindEvents();
        this.syncUIWithState();
        
        // Hide all screens initially to ensure clean state
        document.querySelectorAll('main section.screen').forEach(el => el.setAttribute('hidden', ''));

        // Initial screen transition
        const initialScreen = window.location.hash.replace('#', '') || this.ui.SCREENS.LANDING;
        this.ui.switchScreen(this.findScreenByHeadingId(initialScreen) || this.ui.SCREENS.LANDING, true);
    },

    /**
     * Removes the initial page loader when assets are ready.
     */
    hideLoader() {
        const loader = document.querySelector('.lazy-loader');
        if (!loader) return;

        const performHide = () => {
            loader.setAttribute('hidden', '');
            // Completely remove from DOM after a short delay to allow for transition
            setTimeout(() => loader.remove(), 500);
        };

        if (document.fonts) {
            document.fonts.ready.then(performHide).catch(performHide);
        } else {
            setTimeout(performHide, 500);
        }
        
        // Safety fallback: ensure loader is gone after 2 seconds regardless
        setTimeout(performHide, 2000);
    },

    /**
     * Scans the DOM for required elements and populates the local cache.
     * Maps hyphenated IDs to camelCase for internal consistency.
     */
    cacheElements() {
        this.elements = {};
        const ids = [
            'salaryP1', 'salaryP2', 'salaryP1Label', 'salaryP2Label', 'salaryP1ErrorText', 'salaryP2ErrorText',
            'postcode', 'propertyPrice', 'bedrooms', 'bathrooms', 'councilTaxCost', 'energyCost', 'waterBill',
            'broadbandCost', 'groceriesCost', 'childcareCost', 'insuranceCost', 'otherSharedCosts',
            'depositPercentage', 'mortgageInterestRate', 'mortgageTerm', 'mortgageFees', 'estimatePriceBtn',
            'back-button', 'next-button', 'propertyPrice-estimate-display', 'estimatedPriceValue',
            'postcode-error', 'region-announcement', 'sdlt-estimate', 'sdltDisplay', 'legalFeesDisplay',
            'mortgageFeesDisplay', 'legal-fees-estimate', 'totalEquityDisplay', 'totalUpfrontDisplay',
            'mortgageRequiredDisplay', 'monthlyMortgageDisplay', 'totalRepaymentDisplay',
            'equityP1Display', 'equityP2Display', 'band-price-display', 'bar-p1', 'bar-p2',
            'ratio-text-desc', 'results-table', 'displayPropertyPrice', 'header-brand', 'theme-toggle',
            'salaryP1-error', 'salaryP2-error', 'taxBand-error', 'propertyPrice-error', 'bedrooms-error',
            'bathrooms-error', 'depositPercentage-error', 'mortgageInterestRate-error', 'mortgageTerm-error',
            'councilTaxCost-error', 'energyCost-error', 'waterBill-error', 'broadband-error',
            'groceries-error', 'childcare-error', 'insurance-error', 'other-error',
            'depositPercContainer', 'depositAmtContainer', 'depositAmount',
            'result-p1', 'result-p2', 'total-bill-display', 'result-summary', 'calculation-workings',
            'breakdown-summary', 'bd-mortgage-total', 'bd-mortgage-p1', 'bd-mortgage-p2',
            'bd-tax-total', 'bd-tax-p1', 'bd-tax-p2', 'bd-energy-total', 'bd-energy-p1', 'bd-energy-p2',
            'bd-water-total', 'bd-water-p1', 'bd-water-p2', 'bd-broadband-total', 'bd-broadband-p1', 'bd-broadband-p2',
            'bd-groceries-total', 'bd-groceries-p1', 'bd-groceries-p2', 'bd-committed-total', 'bd-committed-p1', 'bd-committed-p2',
            'bd-total-total', 'bd-total-p1', 'bd-total-p2',
            'wk-salary-p1', 'wk-salary-p2', 'wk-total-salary', 'wk-income-subtitle', 'wk-p1-perc', 'wk-p2-perc',
            'wk-property-price', 'wk-deposit-perc', 'wk-total-equity', 'wk-deposit-split-type',
            'wk-mortgage-required', 'wk-interest-rate', 'wk-mortgage-term', 'wk-monthly-payment', 'wk-total-repayment'
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Map hyphenated IDs to camelCase for elements object consistency
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.elements[key] = el;
            }
        });

        this.elements.progressBar = document.querySelector('.progress__bar');
        this.elements.progressLabel = document.querySelector('.progress__text');
        this.elements.backButton = this.elements.backButton; // mapped above
        this.elements.nextButton = this.elements.nextButton; // mapped above
    },

    /**
     * Binds DOM event listeners to application logic.
     */
    bindEvents() {
        // Form field event binding
        FORM_FIELDS.forEach(field => {
            const el = this.elements[field.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())] || document.getElementById(field.id);
            if (!el) return;

            const debouncedUpdate = this.debounce(() => {
                let val = el.value;
                if (field.type === 'number') val = parseFloat(val) || 0;
                this.store.update({ [field.key || field.id]: val });
                
                // Logic side effects
                if (field.id === 'propertyPrice') this.updatePropertyPriceDisplay(val, false);
                if (field.id === 'depositPercentage' || field.id === 'depositAmount') this.calculateEquityDetails();
                if (field.id === 'mortgageInterestRate' || field.id === 'mortgageTerm') this.calculateMonthlyMortgage();
            }, 300);

            el.addEventListener('input', () => {
                if (field.id === 'postcode') this.formatPostcode(el);
                if (field.id === 'salaryP1' || field.id === 'salaryP2') {
                    this.updateTaxEstimate(field.id === 'salaryP1' ? 'P1' : 'P2');
                    this.calculateRatio();
                }
                debouncedUpdate();
            });
        });

        // Specialized Button Listeners
        if (this.elements.estimatePriceBtn) {
            this.elements.estimatePriceBtn.onclick = () => this.handlePriceEstimation();
        }

        if (this.elements.themeToggle) {
            this.elements.themeToggle.onclick = () => this.toggleTheme();
        }

        if (this.elements.startOverButton) {
            this.elements.startOverButton.onclick = () => this.clearCache();
        }

        if (document.getElementById('downloadCSVBtn')) {
            document.getElementById('downloadCSVBtn').onclick = () => this.downloadCSV();
        }

        // Toggle / Radio Listeners
        document.querySelectorAll('input[name="salaryType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ salaryType: radio.value });
                this.updateSalaryTypeLabels(radio.value);
                this.updateTaxEstimate('P1');
                this.updateTaxEstimate('P2');
                this.calculateRatio();
            };
        });

        document.querySelectorAll('input[name="depositType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ depositType: radio.value });
                if (radio.value === 'percentage') {
                    this.elements.depositPercContainer.removeAttribute('hidden');
                    this.elements.depositAmtContainer.setAttribute('hidden', '');
                } else {
                    this.elements.depositPercContainer.setAttribute('hidden', '');
                    this.elements.depositAmtContainer.removeAttribute('hidden');
                }
                this.calculateEquityDetails();
            };
        });

        document.querySelectorAll('input[name="taxBand"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ band: radio.value });
                this.ui.updatePricePreview(radio.value);
            };
        });

        document.querySelectorAll('input[name="depositSplitType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ depositSplitProportional: radio.value === 'yes' });
                this.calculateEquityDetails();
            };
        });

        document.querySelectorAll('input[name="homeType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ homeType: radio.value });
                this.updateFTBVisibility();
                this.calculateEquityDetails();
            };
        });

        document.querySelectorAll('input[name="buyerStatus"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ isFTB: radio.value === 'ftb' });
                this.calculateEquityDetails();
            };
        });

        // Bulk Utility/Committed Toggles
        document.querySelectorAll('input[name="masterUtilities"]').forEach(radio => {
            radio.onchange = () => this.setAllSplitTypes('utilities', radio.value);
        });

        document.querySelectorAll('input[name="masterCommitted"]').forEach(radio => {
            radio.onchange = () => this.setAllSplitTypes('committed', radio.value);
        });

        // Navigation Intercept
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    },

    /**
     * Updates labels and placeholders based on Gross vs Net income selection.
     */
    updateSalaryTypeLabels(type) {
        if (this.elements.salaryP1Error) this.elements.salaryP1Error.setAttribute('hidden', '');
        if (this.elements.salaryP2Error) this.elements.salaryP2Error.setAttribute('hidden', '');

        if (type === 'gross') {
            this.elements.salaryP1Label.innerText = 'Your Annual Salary (Pre-tax)';
            this.elements.salaryP2Label.innerText = "Your Partner's Annual Salary (Pre-tax)";
            this.elements.salaryP1.placeholder = 'e.g. 35000';
            this.elements.salaryP2.placeholder = 'e.g. 45000';
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Annual Income & Ratio';
        } else {
            this.elements.salaryP1Label.innerText = 'Your Monthly Take-home Pay';
            this.elements.salaryP2Label.innerText = "Your Partner's Monthly Take-home Pay";
            this.elements.salaryP1.placeholder = 'e.g. 2500';
            this.elements.salaryP2.placeholder = 'e.g. 3200';
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Monthly Net Income & Ratio';
        }
    },

    /**
     * Generates and downloads a CSV report of the calculation results.
     */
    downloadCSV() {
        const table = this.elements.resultsTable;
        if (!table) return;

        const state = this.store.data;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "FairShare Bill Splitting Report\n";
        csvContent += `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}\n\n`;

        const salaryLabel = state.salaryType === 'gross' ? 'Annual Salary (Pre-tax)' : 'Monthly Net Pay';
        csvContent += "1. INCOME RATIO WORKINGS\n";
        csvContent += `Your ${salaryLabel},${state.salaryP1}\n`;
        csvContent += `Partner ${salaryLabel},${state.salaryP2}\n`;
        csvContent += `Your Share %,${(state.ratioP1 * 100).toFixed(1)}%\n`;
        csvContent += `Partner Share %,${(state.ratioP2 * 100).toFixed(1)}%\n\n`;

        csvContent += "2. MORTGAGE & EQUITY\n";
        csvContent += `Property Value,${state.propertyPrice}\n`;
        csvContent += `Deposit %,${state.depositPercentage}%\n`;
        csvContent += `Monthly Payment,${state.monthlyMortgagePayment.toFixed(2)}\n\n`;

        csvContent += "3. FULL COST BREAKDOWN\n";
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cols = row.querySelectorAll('th, td');
            const rowData = Array.from(cols).map(col => `"${col.innerText.replace(/[£,]/g, '')}"`);
            csvContent += rowData.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fairshare_report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Toggles the application theme.
     */
    toggleTheme() {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('fairshare_theme', theme);
        
        const logoImg = this.elements.headerBrand?.querySelector('.header-brand__logo');
        if (logoImg) {
            const buster = logoImg.src.match(/\?v=\d+/) || '';
            logoImg.src = `${theme === 'dark' ? 'logo-dark.svg' : 'logo.svg'}${buster}`;
        }
    },

    /**
     * Synchronizes complex UI elements (radios, visibility) with current application state.
     */
    syncUIWithState() {
        const state = this.store.data;
        // Sync radio groups
        const radios = ['salaryType', 'depositType', 'homeType', 'depositSplitType', 'buyerStatus'];
        radios.forEach(name => {
            const val = name === 'buyerStatus' ? (state.isFTB ? 'ftb' : 'standard') : 
                        name === 'depositSplitType' ? (state.depositSplitProportional ? 'yes' : 'no') :
                        state[name];
            const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (radio) radio.checked = true;
        });

        // Sync individual split preferences
        Object.entries(state.splitTypes).forEach(([key, val]) => {
            const radio = document.querySelector(`input[name="${key}SplitType"][value="${val}"]`);
            if (radio) radio.checked = true;
        });

        this.updateFTBVisibility();
        this.calculateEquityDetails();
        this.calculateRatio();
    },

    // --- Logic Wrappers (Bridging Engine/Store/UI) ---

    /**
     * Orchestrates the income ratio calculation between the engine and store.
     */
    calculateRatio() {
        const state = this.store.data;
        let p1Basis = state.salaryP1;
        let p2Basis = state.salaryP2;

        if (state.salaryType === 'gross') {
            p1Basis = FinanceEngine.calculateTakeHome(state.salaryP1, state.regionCode).monthlyNet;
            p2Basis = FinanceEngine.calculateTakeHome(state.salaryP2, state.regionCode).monthlyNet;
        }

        const total = p1Basis + p2Basis;
        if (total > 0) {
            this.store.update({ ratioP1: p1Basis / total, ratioP2: p2Basis / total });
        } else {
            this.store.update({ ratioP1: 0.5, ratioP2: 0.5 });
        }
    },

    /**
     * Orchestrates property equity and deposit calculations.
     */
    calculateEquityDetails() {
        const state = this.store.data;
        if (state.propertyPrice <= 0) return;

        let totalEquity = state.totalEquity;
        let depositPerc = state.depositPercentage;
        let depositAmt = state.depositAmount;

        if (state.depositType === 'percentage') {
            totalEquity = state.propertyPrice * (depositPerc / 100);
            depositAmt = totalEquity;
        } else {
            totalEquity = depositAmt;
            depositPerc = (depositAmt / state.propertyPrice) * 100;
        }

        const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
        const legalFees = state.propertyPrice > 1000000 ? 2500 : (state.propertyPrice > 500000 ? 1800 : 1200);

        const equityP1 = state.depositSplitProportional ? (totalEquity * state.ratioP1) : (totalEquity * 0.5);
        const equityP2 = state.depositSplitProportional ? (totalEquity * (1 - state.ratioP1)) : (totalEquity * 0.5);

        this.store.update({
            totalEquity,
            depositPercentage: depositPerc,
            depositAmount: depositAmt,
            mortgageRequired: state.propertyPrice - totalEquity,
            equityP1,
            equityP2
        });

        this.renderUpfrontWorkings(sdlt, legalFees);
        this.calculateMonthlyMortgage();
    },

    /**
     * Renders upfront cash requirement details to the UI.
     * @param {number} sdlt - Calculated Stamp Duty.
     * @param {number} legalFees - Estimated legal fees.
     */
    renderUpfrontWorkings(sdlt, legalFees) {
        const state = this.store.data;
        const totalUpfront = state.totalEquity + sdlt + legalFees + state.mortgageFees;
        
        if (this.elements.sdltEstimate) this.elements.sdltEstimate.value = sdlt.toLocaleString();
        if (this.elements.legalFeesEstimate) this.elements.legalFeesEstimate.value = legalFees.toLocaleString();
        if (this.elements.sdltDisplay) this.elements.sdltDisplay.innerText = formatCurrency(sdlt);
        if (this.elements.legalFeesDisplay) this.elements.legalFeesDisplay.innerText = formatCurrency(legalFees);
        if (this.elements.totalEquityDisplay) this.elements.totalEquityDisplay.innerText = formatCurrency(state.totalEquity);
        if (this.elements.totalUpfrontDisplay) this.elements.totalUpfrontDisplay.innerText = formatCurrency(totalUpfront);
    },

    /**
     * Orchestrates monthly mortgage payment calculation.
     */
    calculateMonthlyMortgage() {
        const state = this.store.data;
        const result = FinanceEngine.calculateMortgage(state.mortgageRequired, state.mortgageInterestRate, state.mortgageTerm);
        
        this.store.update({
            monthlyMortgagePayment: result.monthlyPayment,
            totalRepayment: result.totalRepayment
        });

        if (this.elements.monthlyMortgageDisplay) this.elements.monthlyMortgageDisplay.innerText = formatCurrency(result.monthlyPayment);
        if (this.elements.totalRepaymentDisplay) this.elements.totalRepaymentDisplay.innerText = formatCurrency(result.totalRepayment);
    },

    /**
     * Handles async property price estimation via ApiService.
     */
    async handlePriceEstimation() {
        const postcode = this.elements.postcode.value.trim();
        const bedrooms = parseInt(this.elements.bedrooms.value) || 2;
        if (!postcode) return;

        this.ui.hideWarning(3);
        const result = await ApiService.getEstimatedPropertyPrice(postcode, bedrooms);
        
        const price = typeof result === 'object' ? result.price : result;
        this.store.update({ propertyPrice: price });
        this.elements.propertyPrice.value = price;
        this.updatePropertyPriceDisplay(price, !!result.isEstimated);
        this.calculateEquityDetails();
    },

    // --- Helper Methods ---

    /**
     * Simple debounce implementation for input handling.
     * @param {Function} func - Function to debounce.
     * @param {number} wait - Wait time in ms.
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Formats postcode input according to UK standards.
     * @param {HTMLInputElement} input - The input element.
     */
    formatPostcode(input) {
        const val = input.value.replace(/\s+/g, '').toUpperCase();
        if (val.length > 3) {
            input.value = val.slice(0, -3) + ' ' + val.slice(-3);
        }
    },

    /**
     * Updates visibility of First Time Buyer specific options.
     */
    updateFTBVisibility() {
        const state = this.store.data;
        const ftbContainer = document.getElementById('ftb-container');
        if (ftbContainer) {
            if (state.homeType === 'first') ftbContainer.removeAttribute('hidden');
            else ftbContainer.setAttribute('hidden', '');
        }
    },

    /**
     * Updates the UI display for estimated or manual property prices.
     * @param {number} price - Property value.
     * @param {boolean} isEstimated - Whether the price is from market data.
     */
    updatePropertyPriceDisplay(price, isEstimated) {
        const display = this.elements.propertyPriceEstimateDisplay;
        if (!display) return;
        if (price > 0) {
            const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
            display.innerHTML = `${labelText}<span>${formatCurrency(price)}</span>`;
            display.removeAttribute('hidden');
        } else {
            display.setAttribute('hidden', '');
        }
    },

    /**
     * Estimates UK tax band and take-home pay based on annual salary.
     * @param {string} p - Partner identifier ('P1' or 'P2').
     */
    updateTaxEstimate(p) {
        const val = parseFloat(this.elements[`salary${p}`].value) || 0;
        const badge = document.getElementById(`salary${p}-tax-badge`);
        if (!badge) return;

        if (this.store.data.salaryType !== 'gross' || val <= 0) {
            badge.setAttribute('hidden', '');
            return;
        }

        const { bandName, monthlyNet } = FinanceEngine.calculateTakeHome(val, this.store.data.regionCode);
        badge.innerText = `${bandName} • Est. £${Math.round(monthlyNet).toLocaleString()}/mo take-home`;
        badge.removeAttribute('hidden');
    },

    /**
     * Bulk sets split type preferences for a specific screen.
     * @param {string} screen - Target screen identifier.
     * @param {string} type - 'yes' (proportional) or 'no' (equal).
     */
    setAllSplitTypes(screen, type) {
        const groups = screen === 'utilities'
            ? ['councilTax', 'energy', 'water', 'broadband']
            : ['groceries', 'childcare', 'insurance', 'otherShared'];

        const splitTypes = { ...this.store.data.splitTypes };
        groups.forEach(group => {
            const radio = document.querySelector(`input[name="${group}SplitType"][value="${type}"]`);
            if (radio) radio.checked = true;
            splitTypes[group] = type;
        });
        this.store.update({ splitTypes });
    },

    /**
     * Calculates the final bill splitting breakdown and transitions to results.
     */
    calculateFinalSplit() {
        const state = this.store.data;
        const upfrontRatio = state.depositSplitProportional ? state.ratioP1 : 0.5;
        
        // Ported calculation logic
        const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
        const legalFees = state.propertyPrice > 1000000 ? 2500 : (state.propertyPrice > 500000 ? 1800 : 1200);
        const totalUpfront = state.totalEquity + sdlt + legalFees + state.mortgageFees;

        const upfrontP1 = totalUpfront * upfrontRatio;
        const upfrontP2 = totalUpfront * (1 - upfrontRatio);

        if (this.elements.totalUpfrontDisplay) this.elements.totalUpfrontDisplay.innerText = formatCurrency(totalUpfront);
        if (this.elements.equityP1Display) this.elements.equityP1Display.innerText = formatCurrency(upfrontP1);
        if (this.elements.equityP2Display) this.elements.equityP2Display.innerText = formatCurrency(upfrontP2);

        // Monthly cost splitting logic
        const getSplit = (key, val) => {
            const pref = state.splitTypes[key] || 'yes';
            const r = pref === 'yes' ? state.ratioP1 : 0.5;
            return { p1: val * r, p2: val * (1 - r) };
        };

        const tax = getSplit('councilTax', state.councilTaxCost);
        const energy = getSplit('energy', state.energyCost);
        const water = getSplit('water', state.waterBill);
        const broadband = getSplit('broadband', state.broadbandCost);
        const groceries = getSplit('groceries', state.groceriesCost);
        const childcare = getSplit('childcare', state.childcareCost);
        const insurance = getSplit('insurance', state.insuranceCost);
        const otherShared = getSplit('otherShared', state.otherSharedCosts);

        const mort = { p1: state.monthlyMortgagePayment * state.ratioP1, p2: state.monthlyMortgagePayment * state.ratioP2 };

        const committedTotal = state.childcareCost + state.insuranceCost + state.otherSharedCosts;
        const committedP1 = childcare.p1 + insurance.p1 + otherShared.p1;
        const committedP2 = childcare.p2 + insurance.p2 + otherShared.p2;

        const totalP1 = tax.p1 + energy.p1 + water.p1 + broadband.p1 + groceries.p1 + committedP1 + mort.p1;
        const totalP2 = tax.p2 + energy.p2 + water.p2 + broadband.p2 + groceries.p2 + committedP2 + mort.p2;
        const total = totalP1 + totalP2;

        if (this.elements.resultP1) this.elements.resultP1.innerText = formatCurrency(totalP1, 2);
        if (this.elements.resultP2) this.elements.resultP2.innerText = formatCurrency(totalP2, 2);
        if (this.elements.totalBillDisplay) this.elements.totalBillDisplay.innerText = formatCurrency(total, 2);

        // Update Breakdown Table
        this.ui.updateBreakdownRow('Mortgage', state.monthlyMortgagePayment, mort.p1, mort.p2);
        this.ui.updateBreakdownRow('Tax', state.councilTaxCost, tax.p1, tax.p2);
        this.ui.updateBreakdownRow('Energy', state.energyCost, energy.p1, energy.p2);
        this.ui.updateBreakdownRow('Water', state.waterBill, water.p1, water.p2);
        this.ui.updateBreakdownRow('Broadband', state.broadbandCost, broadband.p1, broadband.p2);
        this.ui.updateBreakdownRow('Groceries', state.groceriesCost, groceries.p1, groceries.p2);
        this.ui.updateBreakdownRow('Committed', committedTotal, committedP1, committedP2);
        this.ui.updateBreakdownRow('Total', total, totalP1, totalP2);

        this.renderResultsSummary(totalP1, totalP2, total, committedTotal);
        this.renderCalculationWorkings();
        this.ui.switchScreen('screen-7');
    },

    /**
     * Renders text summaries of the results to the results screen.
     * @param {number} p1 - Partner 1 monthly total.
     * @param {number} p2 - Partner 2 monthly total.
     * @param {number} total - Overall monthly total.
     * @param {number} committedTotal - Total committed/lifestyle costs.
     */
    renderResultsSummary(p1, p2, total, committedTotal) {
        const diff = Math.abs(p1 - p2);
        const summaryText = this.elements.resultSummary?.querySelector('.alert__text');
        if (summaryText) {
            const moreP = p1 > p2 ? 'You' : 'Your Partner';
            const verb = moreP === 'You' ? 'pay' : 'pays';
            summaryText.innerText = diff < 0.01 ? "Both partners contribute equally." : `${moreP} ${verb} ${formatCurrency(diff, 2)} more per month.`;
            this.elements.resultSummary.removeAttribute('hidden');
        }

        if (this.elements.breakdownSummary) {
            const state = this.store.data;
            const mainCosts = state.monthlyMortgagePayment + state.councilTaxCost + state.energyCost + state.waterBill;
            const lifestyleCosts = state.broadbandCost + state.groceriesCost + committedTotal;
            this.elements.breakdownSummary.innerText = `Out of the £${total.toLocaleString('en-GB', {minimumFractionDigits: 2})} total monthly spend, £${mainCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} is dedicated to the property and utilities, while £${lifestyleCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} covers shared lifestyle and committed costs.`;
        }
    },

    /**
     * Renders detailed calculation workings to the hidden workings panel.
     */
    renderCalculationWorkings() {
        const state = this.store.data;
        const wk = this.elements;
        if (wk.wkSalaryP1) wk.wkSalaryP1.innerText = formatCurrency(state.salaryP1);
        if (wk.wkSalaryP2) wk.wkSalaryP2.innerText = formatCurrency(state.salaryP2);
        if (wk.wkTotalSalary) wk.wkTotalSalary.innerText = formatCurrency(state.salaryP1 + state.salaryP2);
        if (wk.wkP1Perc) wk.wkP1Perc.innerText = (state.ratioP1 * 100).toFixed(1) + '%';
        if (wk.wkP2Perc) wk.wkP2Perc.innerText = (state.ratioP2 * 100).toFixed(1) + '%';
        if (wk.wkPropertyPrice) wk.wkPropertyPrice.innerText = formatCurrency(state.propertyPrice);
        if (wk.wkDepositPerc) wk.wkDepositPerc.innerText = state.depositPercentage + '%';
        if (wk.wkTotalEquity) wk.wkTotalEquity.innerText = formatCurrency(state.totalEquity);
        if (wk.wkMonthlyPayment) wk.wkMonthlyPayment.innerText = formatCurrency(state.monthlyMortgagePayment, 2);
    },

    /**
     * Populates regional utility and tax estimates into the UI and state.
     */
    populateEstimates() {
        const state = this.store.data;
        const councilTax = BAND_PRICES[state.band] || 0;
        let energy = 40 + (state.beds * 25) + (state.baths * 15);
        if (state.isNorth) energy *= 1.1;
        if (['E', 'F', 'G', 'H'].includes(state.band)) energy *= 1.15;

        const water = ApiService.estimateWaterCost(state.postcode, state.baths);

        this.store.update({
            councilTaxCost: councilTax,
            energyCost: Math.round(energy),
            waterBill: Math.round(water)
        });

        if (this.elements.councilTaxCost) this.elements.councilTaxCost.value = councilTax;
        if (this.elements.energyCost) this.elements.energyCost.value = Math.round(energy);
        if (this.elements.waterBill) this.elements.waterBill.value = Math.round(water);
    },

    /**
     * Validates current screen data and transitions to the next screen if successful.
     * @param {string} screenId - Source screen ID.
     */
    async validateAndNext(screenId) {
        const state = this.store.data;
        
        // Define inline validation rules
        const rules = {
            [this.ui.SCREENS.INCOME]: {
                isValid: () => (state.salaryP1 + state.salaryP2) > 0,
                onSuccess: () => this.calculateRatio(),
                next: this.ui.SCREENS.PROPERTY
            },
            [this.ui.SCREENS.PROPERTY]: {
                isValid: () => state.propertyPrice > 0 && !!state.band,
                onSuccess: () => this.populateEstimates(),
                next: this.ui.SCREENS.MORTGAGE
            },
            [this.ui.SCREENS.MORTGAGE]: {
                isValid: () => state.mortgageInterestRate >= 0 && state.mortgageTerm > 0,
                onSuccess: () => this.calculateMonthlyMortgage(),
                next: this.ui.SCREENS.UTILITIES
            },
            [this.ui.SCREENS.UTILITIES]: {
                isValid: () => true,
                next: this.ui.SCREENS.COMMITTED
            },
            [this.ui.SCREENS.COMMITTED]: {
                isValid: () => true,
                onSuccess: () => this.calculateFinalSplit(),
                next: this.ui.SCREENS.RESULTS
            }
        };

        const config = rules[screenId];
        if (config && config.isValid()) {
            if (config.onSuccess) config.onSuccess();
            this.ui.switchScreen(config.next);
        } else {
            this.ui.showWarning(parseInt(screenId.split('-')[1]), "Please ensure all required fields are valid.");
        }
    },

    /**
     * Attempts to resolve a screen ID from a section heading ID.
     * @param {string} id - Hash fragment or heading ID.
     * @returns {string|undefined} Section ID.
     */
    findScreenByHeadingId(id) {
        const heading = document.getElementById(id);
        return heading?.closest('section')?.id;
    },

    /**
     * Updates navigation button configuration for the current screen.
     * @param {string} screenId - Active screen identifier.
     */
    updatePagination(screenId) {
        const back = this.elements.backButton;
        const next = this.elements.nextButton;
        if (!back || !next) return;

        const config = {
            [this.ui.SCREENS.LANDING]: { back: null, next: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), text: 'Get Started' },
            [this.ui.SCREENS.INCOME]: { back: () => this.ui.switchScreen(this.ui.SCREENS.LANDING), next: () => this.validateAndNext(this.ui.SCREENS.INCOME) },
            [this.ui.SCREENS.PROPERTY]: { back: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), next: () => this.validateAndNext(this.ui.SCREENS.PROPERTY) },
            [this.ui.SCREENS.MORTGAGE]: { back: () => this.ui.switchScreen(this.ui.SCREENS.PROPERTY), next: () => this.validateAndNext(this.ui.SCREENS.MORTGAGE) },
            [this.ui.SCREENS.UTILITIES]: { back: () => this.ui.switchScreen(this.ui.SCREENS.MORTGAGE), next: () => this.validateAndNext(this.ui.SCREENS.UTILITIES) },
            [this.ui.SCREENS.COMMITTED]: { back: () => this.ui.switchScreen(this.ui.SCREENS.UTILITIES), next: () => this.validateAndNext(this.ui.SCREENS.COMMITTED), text: 'Calculate' },
            [this.ui.SCREENS.RESULTS]: { back: () => this.ui.switchScreen(this.ui.SCREENS.COMMITTED), next: () => this.clearCache(), text: 'Start Over' }
        };

        const screen = config[screenId];
        if (screen.back) {
            back.onclick = screen.back;
            back.removeAttribute('hidden');
        } else {
            back.setAttribute('hidden', '');
        }

        next.onclick = screen.next;
        next.innerText = screen.text || 'Next';
    },

    /**
     * Clears application state and performs a clean reload.
     * Preserves the user's theme preference.
     */
    clearCache() {
        const theme = localStorage.getItem('fairshare_theme');
        this.store.clear();
        if (theme) localStorage.setItem('fairshare_theme', theme);
        
        // Redirect to base URL to ensure clean reload without old hashes
        const baseUrl = window.location.origin + window.location.pathname;
        window.location.replace(baseUrl);
    },

    /**
     * Intercepts global keyboard events for accessibility navigation.
     * @param {KeyboardEvent} e 
     */
    handleGlobalKeydown(e) {
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isInput) return;
        
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            this.elements.nextButton?.click();
        } else if (e.key === 'ArrowLeft') {
            this.elements.backButton?.click();
        }
    }
};

window.app = app; // Expose for debugging
document.addEventListener('DOMContentLoaded', () => app.init());
