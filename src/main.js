/**
 * main.js
 * Application entry point and orchestrator.
 */

import State, { INITIAL_STATE } from './core/State.js';
import FinanceOrchestrator from './core/FinanceOrchestrator.js';
import ApiService from './services/ApiService.js';
import UIManager from './ui/UIManager.js';
import ThemeManager from './ui/ThemeManager.js';
import NavigationController from './ui/NavigationController.js';
import FormController from './ui/FormController.js';
import { formatCurrency } from './utils/Helpers.js';
import CSV from './ui/Export.js';
import { FORM_FIELDS, BAND_PRICES } from './core/Constants.js';

const app = {
    /**
     * Initializes the application, caches elements, and sets up controllers.
     */
    init() {
        console.log(`[App] Initializing FairShare...`);
        this.hideLoader();
        this.cacheElements();
        
        // 1. Initialize Core Managers
        this.ui = new UIManager(this.elements, BAND_PRICES, (id) => this.nav.updatePagination(id));
        this.store = new State(INITIAL_STATE, (data) => this.ui.render(data));
        this.themeManager = new ThemeManager(this.elements);
        
        // 2. Initialize Specialized Controllers
        this.nav = new NavigationController(this, this.ui, this.elements);
        this.form = new FormController(this, this.ui, this.store, this.elements);
        
        // 3. Setup Initial State
        this.store.hydrate();

        // 4. Initialize Theme
        this.themeManager.init();

        this.bindGlobalEvents();
        this.syncUIWithState();
        
        // Hide all screens initially to ensure clean state
        document.querySelectorAll('main section.screen').forEach(el => el.setAttribute('hidden', ''));

        // Initial screen transition
        const initialScreen = window.location.hash.replace('#', '') || this.ui.SCREENS.LANDING;
        this.ui.switchScreen(this.nav.findScreenByHeadingId(initialScreen) || this.ui.SCREENS.LANDING, true);
    },

    /**
     * Removes the initial page loader when assets are ready.
     */
    hideLoader() {
        const loader = document.querySelector('.lazy-loader');
        if (!loader) return;

        const performHide = () => {
            loader.setAttribute('hidden', '');
            setTimeout(() => loader.remove(), 500);
        };

        if (document.fonts) {
            document.fonts.ready.then(performHide).catch(performHide);
        } else {
            setTimeout(performHide, 500);
        }
        
        setTimeout(performHide, 2000);
    },

    /**
     * Scans the DOM for required elements and populates the local cache.
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
            'depositPercContainer', 'depositAmtContainer', 'depositAmount',
            'salaryP1-desc', 'salaryP2-desc',
            'result-p1', 'result-p2', 'total-bill-display', 'result-summary', 'calculation-workings',
            'breakdown-summary', 'bd-mortgage-total', 'bd-mortgage-p1', 'bd-mortgage-p2',
            'bd-tax-total', 'bd-tax-p1', 'bd-tax-p2', 'bd-energy-total', 'bd-energy-p1', 'bd-energy-p2',
            'bd-water-total', 'bd-water-p1', 'bd-water-p2', 'bd-broadband-total', 'bd-broadband-p1', 'bd-broadband-p2',
            'bd-groceries-total', 'bd-groceries-p1', 'bd-groceries-p2', 
            'bd-childcare-total', 'bd-childcare-p1', 'bd-childcare-p2',
            'bd-insurance-total', 'bd-insurance-p1', 'bd-insurance-p2',
            'bd-other-total', 'bd-other-p1', 'bd-other-p2',
            'bd-total-total', 'bd-total-p1', 'bd-total-p2',
            'wk-salary-p1', 'wk-salary-p2', 'wk-total-salary', 'wk-income-subtitle', 'wk-p1-perc', 'wk-p2-perc',
            'wk-property-price', 'wk-deposit-perc', 'wk-total-equity', 'wk-deposit-split-type',
            'wk-mortgage-required', 'wk-interest-rate', 'wk-mortgage-term', 'wk-monthly-payment', 'wk-total-repayment',
            'start-over-button'
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.elements[key] = el;
            }
        });

        this.elements.progressBar = document.querySelector('.progress__bar');
        this.elements.progressLabel = document.querySelector('.progress__text');
    },

    /**
     * Binds specialized global event listeners using event delegation.
     */
    bindGlobalEvents() {
        const main = document.querySelector('main');
        if (!main) return;

        main.onclick = (e) => {
            const target = e.target.closest('button, a');
            if (!target) return;

            const id = target.id;

            if (id === 'estimatePriceBtn') {
                this.handlePriceEstimation();
            } else if (id === 'theme-toggle' || target.closest('#theme-toggle')) {
                this.toggleTheme();
            } else if (id === 'start-over-button') {
                this.clearCache();
            } else if (id === 'downloadCSVBtn') {
                this.downloadCSV();
            }
        };
    },

    /**
     * Synchronizes complex UI elements with current application state.
     */
    syncUIWithState() {
        const state = this.store.data;

        // Sync standard form fields
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = state[field.key || field.id];
            if (val) el.value = val;
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

        this.form.updateFTBVisibility();
        this.form.updateSalaryTypeLabels(state.salaryType);
        
        const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
        this.store.update(update);
        this.syncCalculatedFields(update);
        this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
    },

    /**
     * Syncs transient/calculated values back to UI elements.
     */
    syncCalculatedFields(update) {
        if (update.depositPercentage !== undefined && this.elements.depositPercentage) 
            this.elements.depositPercentage.value = update.depositPercentage.toFixed(1);
        if (update.depositAmount !== undefined && this.elements.depositAmount) 
            this.elements.depositAmount.value = update.depositAmount;

        if (update._sdlt !== undefined) this.renderUpfrontWorkings(update._sdlt, update._legalFees);
        
        if (this.elements.monthlyMortgageDisplay && update.monthlyMortgagePayment !== undefined) 
            this.elements.monthlyMortgageDisplay.innerText = formatCurrency(update.monthlyMortgagePayment);
        if (this.elements.totalRepaymentDisplay && update.totalRepayment !== undefined) 
            this.elements.totalRepaymentDisplay.innerText = formatCurrency(update.totalRepayment);

        // Utility and regional estimate sync
        if (update.councilTaxCost !== undefined && this.elements.councilTaxCost) 
            this.elements.councilTaxCost.value = update.councilTaxCost;
        if (update.energyCost !== undefined && this.elements.energyCost) 
            this.elements.energyCost.value = update.energyCost;
        if (update.waterBill !== undefined && this.elements.waterBill) 
            this.elements.waterBill.value = update.waterBill;
        if (update.broadbandCost !== undefined && this.elements.broadbandCost) 
            this.elements.broadbandCost.value = update.broadbandCost;
    },

    /**
     * Renders upfront cash requirement details to the UI.
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
     * Handles async property price estimation.
     */
    async handlePriceEstimation() {
        try {
            const postcode = this.elements.postcode.value.trim();
            const bedrooms = parseInt(this.elements.bedrooms.value) || 2;
            if (!postcode) return;

            this.ui.hideWarning(3);
            const result = await ApiService.getEstimatedPropertyPrice(postcode, bedrooms);
            
            const price = typeof result === 'object' ? result.price : result;
            this.store.update({ propertyPrice: price });
            this.elements.propertyPrice.value = price;
            this.form.updatePropertyPriceDisplay(price, !!result.isEstimated);
            
            const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
            this.store.update(update);
            this.syncCalculatedFields(update);
        } catch (error) {
            console.error(`[App] Error during price estimation:`, error);
            this.ui.showWarning(3, "Failed to estimate property price. Please enter manually.");
        }
    },

    /**
     * Calculates the final bill splitting breakdown and transitions to results.
     */
    renderResults() {
        const summary = FinanceOrchestrator.getFinalSummary(this.store.data);
        const { monthly } = summary;
        const { costs } = monthly;

        const rows = [
            ['Mortgage', costs.mortgage],
            ['Tax', costs.councilTax],
            ['Energy', costs.energy],
            ['Water', costs.water],
            ['Broadband', costs.broadband],
            ['Groceries', costs.groceries],
            ['Childcare', costs.childcare],
            ['Insurance', costs.insurance],
            ['Other', costs.otherShared]
        ];

        rows.forEach(([label, cost]) => {
            this.ui.updateBreakdownRow(label, cost.total, cost.p1, cost.p2);
        });
        
        this.ui.updateBreakdownRow('Total', monthly.total, monthly.p1, monthly.p2);

        this.ui.renderResultsSummary(summary);
        this.ui.renderCalculationWorkings(this.store.data);
    },

    /**
     * Validates current screen data and transitions to the next screen.
     */
    async validateAndNext(screenId) {
        try {
            this.form.forceStateSync();

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

            const isScreenValid = this.form.validateScreen(screenId);
            
            if (!isScreenValid) {
                this.ui.showWarning(parseInt(screenId.split('-')[1]), "Please ensure all required fields are valid.");
                return;
            }

            this.ui.hideWarning(parseInt(screenId.split('-')[1]));

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
        } catch (error) {
            console.error(`[App] Error during screen transition:`, error);
        }
    },

    /**
     * Clears application state and performs a clean reload.
     */
    async clearCache() {
        try {
            const theme = localStorage.getItem('fairshare_theme');
            this.store.clear();
            if (theme) localStorage.setItem('fairshare_theme', theme);
            
            // Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            
            window.location.hash = '';
            window.location.replace(window.location.origin + window.location.pathname);
        } catch (error) {
            console.error(`[App] Error clearing cache:`, error);
            // Fallback reload
            window.location.reload();
        }
    },

    /**
     * Toggles the application theme.
     */
    toggleTheme() {
        this.themeManager.toggle();
    },

    /**
     * Generates and downloads a CSV report.
     */
    downloadCSV() {
        try {
            CSV.download(this.store.data, this.elements.resultsTable);
        } catch (error) {
            console.error(`[App] Error downloading CSV:`, error);
        }
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
