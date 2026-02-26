/**
 * main.js
 * Application entry point and orchestrator.
 */

import State, { INITIAL_STATE } from './core/State.js';
import FinanceEngine from './core/FinanceEngine.js';
import FinanceOrchestrator from './core/FinanceOrchestrator.js';
import ApiService from './services/ApiService.js';
import UIManager from './ui/UIManager.js';
import { formatCurrency, debounce } from './utils/Helpers.js';
import CSV from './ui/Export.js';
import Validator from './core/Validator.js';
import { FORM_FIELDS, BAND_PRICES } from './core/Constants.js';

const app = {
    /**
     * Initializes the application, caches elements, and sets up state/UI managers.
     */
    init() {
        this.hideLoader();
        this.cacheElements();
        
        // Pass a bound callback to decouple UIManager from global app
        this.ui = new UIManager(this.elements, BAND_PRICES, (id) => this.updatePagination(id));
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
            'salaryP1-desc', 'salaryP2-desc',
            'result-p1', 'result-p2', 'total-bill-display', 'result-summary', 'calculation-workings',
            'breakdown-summary', 'bd-mortgage-total', 'bd-mortgage-p1', 'bd-mortgage-p2',
            'bd-tax-total', 'bd-tax-p1', 'bd-tax-p2', 'bd-energy-total', 'bd-energy-p1', 'bd-energy-p2',
            'bd-water-total', 'bd-water-p1', 'bd-water-p2', 'bd-broadband-total', 'bd-broadband-p1', 'bd-broadband-p2',
            'bd-groceries-total', 'bd-groceries-p1', 'bd-groceries-p2', 'bd-committed-total', 'bd-committed-p1', 'bd-committed-p2',
            'bd-total-total', 'bd-total-p1', 'bd-total-p2',
            'wk-salary-p1', 'wk-salary-p2', 'wk-total-salary', 'wk-income-subtitle', 'wk-p1-perc', 'wk-p2-perc',
            'wk-property-price', 'wk-deposit-perc', 'wk-total-equity', 'wk-deposit-split-type',
            'wk-mortgage-required', 'wk-interest-rate', 'wk-mortgage-term', 'wk-monthly-payment', 'wk-total-repayment',
            'start-over-button'
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
    },

    /**
     * Binds DOM event listeners to application logic.
     */
    bindEvents() {
        // Form field event binding - Highly declarative
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;

            const debouncedUpdate = debounce(() => {
                let val = el.value;
                if (field.type === 'number') val = parseFloat(val) || 0;
                this.store.update({ [field.key || field.id]: val });
                
                // Logic side effects handled by orchestrator updates
                const stateUpdate = {};
                if (field.id === 'propertyPrice') {
                    this.updatePropertyPriceDisplay(val, false);
                    Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
                }
                if (['depositPercentage', 'depositAmount', 'mortgageInterestRate', 'mortgageTerm'].includes(field.id)) {
                    Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
                }
                
                if (Object.keys(stateUpdate).length > 0) {
                    this.store.update(stateUpdate);
                    this.syncCalculatedFields(stateUpdate);
                }
            }, 300);

            el.addEventListener('input', () => {
                this.clearFieldError(field.id);
                if (field.id === 'postcode') {
                    this.formatPostcode(el);
                    this.handlePostcodeChange(el.value);
                }
                if (field.id === 'salaryP1' || field.id === 'salaryP2') {
                    this.updateTaxEstimate(field.id === 'salaryP1' ? 'P1' : 'P2');
                    this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
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
                this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
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
                this.store.update(FinanceOrchestrator.calculateEquityDetails(this.store.data));
            };
        });

        document.querySelectorAll('input[name="taxBand"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ taxBand: radio.value });
                this.ui.updatePricePreview(radio.value);
            };
        });

        document.querySelectorAll('input[name="depositSplitType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ depositSplitProportional: radio.value === 'yes' });
                const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
                this.store.update(update);
                this.syncCalculatedFields(update);
            };
        });

        document.querySelectorAll('input[name="homeType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ homeType: radio.value });
                this.updateFTBVisibility();
                this.store.update(FinanceOrchestrator.calculateEquityDetails(this.store.data));
            };
        });

        document.querySelectorAll('input[name="buyerStatus"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ isFTB: radio.value === 'ftb' });
                this.store.update(FinanceOrchestrator.calculateEquityDetails(this.store.data));
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
            this.elements.salaryP1Label.innerText = 'Your Annual Salary (Pre-tax) *';
            this.elements.salaryP2Label.innerText = "Your Partner's Annual Salary (Pre-tax) *";
            this.elements.salaryP1.placeholder = 'e.g. 35000';
            this.elements.salaryP2.placeholder = 'e.g. 45000';
            if (this.elements.salaryP1Desc) this.elements.salaryP1Desc.innerText = 'Enter your total yearly income before any deductions.';
            if (this.elements.salaryP2Desc) this.elements.salaryP2Desc.innerText = "Enter your partner's total yearly income before any deductions.";
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Annual Income & Ratio';
        } else {
            this.elements.salaryP1Label.innerText = 'Your Monthly Take-home Pay *';
            this.elements.salaryP2Label.innerText = "Your Partner's Monthly Take-home Pay *";
            this.elements.salaryP1.placeholder = 'e.g. 2500';
            this.elements.salaryP2.placeholder = 'e.g. 3200';
            if (this.elements.salaryP1Desc) this.elements.salaryP1Desc.innerText = 'Enter your average monthly income after all taxes and deductions.';
            if (this.elements.salaryP2Desc) this.elements.salaryP2Desc.innerText = "Enter your partner's average monthly income after all taxes and deductions.";
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Monthly Net Income & Ratio';
        }
    },

    /**
     * Generates and downloads a CSV report of the calculation results.
     */
    downloadCSV() {
        CSV.download(this.store.data, this.elements.resultsTable);
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

        // Sync standard form fields (text/number)
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = state[field.key || field.id];
            // Only sync if there is actual data to avoid overwriting with defaults
            if (val) {
                el.value = val;
            }
        });

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
        const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
        this.store.update(update);
        this.syncCalculatedFields(update);
        this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
    },

    // --- Logic Wrappers (Bridging Engine/Store/UI) ---

    /**
     * Syncs transient/calculated values back to UI elements.
     * @param {Object} update - Result of an orchestration calculation.
     */
    syncCalculatedFields(update) {
        if (update.depositPercentage && this.elements.depositPercentage) 
            this.elements.depositPercentage.value = update.depositPercentage;
        if (update.depositAmount && this.elements.depositAmount) 
            this.elements.depositAmount.value = update.depositAmount;

        if (update._sdlt !== undefined) this.renderUpfrontWorkings(update._sdlt, update._legalFees);
        
        if (this.elements.monthlyMortgageDisplay && update.monthlyMortgagePayment !== undefined) 
            this.elements.monthlyMortgageDisplay.innerText = formatCurrency(update.monthlyMortgagePayment);
        if (this.elements.totalRepaymentDisplay && update.totalRepayment !== undefined) 
            this.elements.totalRepaymentDisplay.innerText = formatCurrency(update.totalRepayment);
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
        
        const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
        this.store.update(update);
        this.syncCalculatedFields(update);
    },

    // --- Helper Methods ---

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
     * Handles postcode input changes to detect region and update announcements.
     * @param {string} postcode - The UK postcode.
     */
    handlePostcodeChange(postcode) {
        const region = ApiService.getRegionFromPostcode(postcode);
        const announce = this.elements.regionAnnouncement;
        if (!announce) return;

        if (region) {
            this.store.update({
                regionCode: region.code,
                isNorth: region.key === 'NORTH'
            });

            const text = region.key === 'NORTH'
                ? `${region.name} region detected. Heating estimates adjusted.`
                : `${region.name} region detected.`;

            announce.querySelector('.alert__text').innerText = text;
            announce.removeAttribute('hidden');
            
            // Recalculate SDLT/Legal fees as they are region-dependent
            const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
            this.store.update(update);
            this.syncCalculatedFields(update);
        } else {
            announce.setAttribute('hidden', '');
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
            const formatted = formatCurrency(price);
            const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
            display.innerHTML = `${labelText}<span>${formatted}</span>`;
            display.removeAttribute('hidden');
            if (this.elements.displayPropertyPrice) {
                // Remove £ symbol as it's provided by .input-group__addon
                this.elements.displayPropertyPrice.value = price.toLocaleString('en-GB');
            }
        } else {
            display.setAttribute('hidden', '');
            if (this.elements.displayPropertyPrice) {
                this.elements.displayPropertyPrice.value = '';
            }
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
    renderResults() {
        const summary = FinanceOrchestrator.getFinalSummary(this.store.data);
        const { monthly } = summary;
        const { costs } = monthly;

        // UI Updates via UIManager
        this.ui.updateBreakdownRow('Mortgage', costs.mortgage.total, costs.mortgage.p1, costs.mortgage.p2);
        this.ui.updateBreakdownRow('Tax', costs.councilTax.total, costs.councilTax.p1, costs.councilTax.p2);
        this.ui.updateBreakdownRow('Energy', costs.energy.total, costs.energy.p1, costs.energy.p2);
        this.ui.updateBreakdownRow('Water', costs.water.total, costs.water.p1, costs.water.p2);
        this.ui.updateBreakdownRow('Broadband', costs.broadband.total, costs.broadband.p1, costs.broadband.p2);
        this.ui.updateBreakdownRow('Groceries', costs.groceries.total, costs.groceries.p1, costs.groceries.p2);
        
        const committedTotal = costs.childcare.total + costs.insurance.total + costs.otherShared.total;
        const committedP1 = costs.childcare.p1 + costs.insurance.p1 + costs.otherShared.p1;
        const committedP2 = costs.childcare.p2 + costs.insurance.p2 + costs.otherShared.p2;
        this.ui.updateBreakdownRow('Committed', committedTotal, committedP1, committedP2);
        
        this.ui.updateBreakdownRow('Total', monthly.total, monthly.p1, monthly.p2);

        this.ui.renderResultsSummary(summary);
        this.ui.renderCalculationWorkings(this.store.data);
        this.ui.switchScreen('screen-7');
    },

    /**
     * Clears the error state for a specific field.
     * @param {string} fieldId - ID of the field to clear.
     */
    clearFieldError(fieldId) {
        const el = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}-error`) || document.getElementById(fieldId.replace('Cost', '') + '-error');
        const group = el?.closest('.input-group');

        errorEl?.setAttribute('hidden', '');
        group?.classList.remove('input-group--error');
        
        // Also clear screen-level warnings if any field is being fixed
        const screenId = el?.closest('section.screen')?.id;
        if (screenId) {
            this.ui.hideWarning(parseInt(screenId.split('-')[1]));
        }
    },

    /**
     * Performs field-level validation for a specific screen.
     * Highlights invalid fields and toggles error messages.
     * @param {string} screenId - Target screen ID.
     * @returns {boolean} Whether the screen data is valid.
     */
    validateScreen(screenId) {
        // Ensure state is fresh before validation
        this.forceStateSync();
        
        const { isValid, errors } = Validator.validateScreen(screenId, this.store.data);

        // Map of screen fields to clear/set
        const screenFields = {
            [this.ui.SCREENS.INCOME]: ['salaryP1', 'salaryP2'],
            [this.ui.SCREENS.PROPERTY]: ['postcode', 'propertyPrice', 'taxBand'],
            [this.ui.SCREENS.MORTGAGE]: ['depositPercentage', 'depositAmount', 'mortgageInterestRate', 'mortgageTerm'],
            [this.ui.SCREENS.UTILITIES]: ['councilTaxCost', 'energyCost', 'waterBill', 'broadbandCost'],
            [this.ui.SCREENS.COMMITTED]: ['groceriesCost', 'childcareCost', 'insuranceCost', 'otherSharedCosts']
        };

        const setFieldState = (fieldId, fieldValid) => {
            const el = document.getElementById(fieldId);
            const errorEl = document.getElementById(`${fieldId}-error`) || document.getElementById(fieldId.replace('Cost', '') + '-error');
            const group = el?.closest('.input-group') || el?.closest('.segmented-control');

            if (!fieldValid) {
                errorEl?.removeAttribute('hidden');
                group?.classList.add('input-group--error');
            } else {
                errorEl?.setAttribute('hidden', '');
                group?.classList.remove('input-group--error');
            }
        };

        // Clear all errors on screen first, then re-apply based on Validator results
        (screenFields[screenId] || []).forEach(f => setFieldState(f, true));
        errors.forEach(f => setFieldState(f, false));

        return isValid;
    },

    /**
     * Forces an immediate update of the state from all current DOM input values.
     * Comprehensive sync for all field types, including radios and nested split preferences.
     */
    forceStateSync() {
        const stateUpdate = {};
        
        // 1. Sync standard form fields (text/number)
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (el) {
                let val = el.value;
                if (field.type === 'number') val = parseFloat(val) || 0;
                stateUpdate[field.key || field.id] = val;
            }
        });

        // 2. Sync ALL radio groups found in the document
        const radioNames = new Set();
        document.querySelectorAll('input[type="radio"]').forEach(r => radioNames.add(r.name));
        
        radioNames.forEach(name => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (checked) {
                if (name.endsWith('SplitType')) {
                    if (!stateUpdate.splitTypes) stateUpdate.splitTypes = { ...this.store.data.splitTypes };
                    const key = name.replace('SplitType', '');
                    stateUpdate.splitTypes[key] = checked.value;
                } 
                else if (name === 'buyerStatus') {
                    stateUpdate.isFTB = checked.value === 'ftb';
                }
                else {
                    stateUpdate[name] = checked.value;
                }
            }
        });

        this.store.update(stateUpdate);
    },

    /**
     * Validates current screen data and transitions to the next screen if successful.
     * @param {string} screenId - Source screen ID.
     */
    async validateAndNext(screenId) {
        // 1. Force state sync from DOM immediately
        this.forceStateSync();

        // 2. Run screen-specific logic updates based on the NEW state
        let stateUpdate = {};
        if (screenId === this.ui.SCREENS.INCOME) {
            stateUpdate = FinanceOrchestrator.calculateRatio(this.store.data);
        }
        if (screenId === this.ui.SCREENS.PROPERTY) {
            Object.assign(stateUpdate, FinanceOrchestrator.populateEstimates(this.store.data));
            Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
        }
        if (screenId === this.ui.SCREENS.MORTGAGE) {
            Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
        }
        if (screenId === this.ui.SCREENS.COMMITTED) {
            this.renderResults();
        }

        if (Object.keys(stateUpdate).length > 0) {
            this.store.update(stateUpdate);
            this.syncCalculatedFields(stateUpdate);
        }

        // 3. Now validate the refreshed state/DOM
        const isScreenValid = this.validateScreen(screenId);
        
        if (!isScreenValid) {
            this.ui.showWarning(parseInt(screenId.split('-')[1]), "Please ensure all required fields are valid.");
            return;
        }

        this.ui.hideWarning(parseInt(screenId.split('-')[1]));

        // 4. Navigate to next screen
        const nextScreens = {
            [this.ui.SCREENS.INCOME]: this.ui.SCREENS.PROPERTY,
            [this.ui.SCREENS.PROPERTY]: this.ui.SCREENS.MORTGAGE,
            [this.ui.SCREENS.MORTGAGE]: this.ui.SCREENS.UTILITIES,
            [this.ui.SCREENS.UTILITIES]: this.ui.SCREENS.COMMITTED,
            [this.ui.SCREENS.COMMITTED]: this.ui.SCREENS.RESULTS
        };

        if (nextScreens[screenId]) {
            this.ui.switchScreen(nextScreens[screenId]);
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
        
        // Clear hash and reload to landing
        window.location.hash = '';
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
