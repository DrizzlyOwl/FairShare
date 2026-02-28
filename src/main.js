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
import { FORM_FIELDS, BAND_PRICES, SCREEN_MAP, NEXT_SCREEN_MAP } from './core/Constants.js';

const app = {
    /**
     * Initializes the application, caches elements, and sets up controllers.
     */
    init() {
        console.log(`[App] Initializing FairShare...`);
        this.cacheElements();
        this.hideLoader();
        
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
        const initialScreen = window.location.hash.replace('#', '') || SCREEN_MAP.LANDING;
        this.ui.switchScreen(this.nav.findScreenByHeadingId(initialScreen) || SCREEN_MAP.LANDING, true);
    },

    /**
     * Removes the initial page loader when assets are ready using a race condition.
     */
    hideLoader() {
        const loader = document.querySelector('.lazy-loader');
        if (!loader) return;

        const performHide = () => {
            if (!loader.parentElement) return; // Already removed
            loader.setAttribute('hidden', '');
            setTimeout(() => loader.remove(), 500);
        };

        // Race between font loading and a 2s timeout
        const fontLoad = document.fonts ? document.fonts.ready : Promise.resolve();
        const timeout = new Promise(resolve => setTimeout(resolve, 2000));

        Promise.race([fontLoad, timeout]).then(performHide).catch(performHide);
    },

    /**
     * Scans the DOM for elements with [data-ui] and populates the local cache.
     */
    cacheElements() {
        this.elements = {};
        document.querySelectorAll('[data-ui]').forEach(el => {
            const key = el.dataset.ui;
            this.elements[key] = el;
        });
    },

    /**
     * Binds specialized global event listeners using action delegation.
     */
    bindGlobalEvents() {
        const main = document.querySelector('main');
        if (!main) return;

        main.onclick = (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            if (typeof this[action] === 'function') {
                this[action](e);
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
            if (val !== undefined) el.value = val;
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
        
        // Let UIManager handle initial calculations sync
        const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
        this.store.update(update);
        this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
        
        // Trigger manual render for non-observed calculated fields
        if (update._sdlt !== undefined) this.renderUpfrontWorkings(update._sdlt, update._legalFees);
    },

    /**
     * Syncs transient/calculated values back to UI elements.
     */
    syncCalculatedFields(update) {
        // Most fields are now handled by UIManager.render which is triggered by store.update
        // We only handle specific manual orchestrations here if needed
        if (update._sdlt !== undefined) this.renderUpfrontWorkings(update._sdlt, update._legalFees);

        // Utility and regional estimate sync
        const utilityFields = ['councilTaxCost', 'energyCost', 'waterBill', 'broadbandCost'];
        utilityFields.forEach(id => {
            if (update[id] !== undefined && this.elements[id]) {
                this.elements[id].value = update[id];
            }
        });
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
        const postcode = this.elements.postcode.value.trim();
        const bedrooms = parseInt(this.elements.bedrooms.value) || 2;
        if (!postcode) return;

        this.ui.hideWarning(3);
        
        try {
            const result = await ApiService.getEstimatedPropertyPrice(postcode, bedrooms);
            const price = typeof result === 'object' ? result.price : result;
            
            this.store.update({ propertyPrice: price });
            this.elements.propertyPrice.value = price;
            this.form.updatePropertyPriceDisplay(price, !!result.isEstimated);
            
            const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
            this.store.update(update);
            this.syncCalculatedFields(update);
        } catch (error) {
            this.handleError(error, 3, "Failed to estimate property price. Please enter manually.");
        }
    },

    /**
     * Standardized error handling for user-facing issues.
     */
    handleError(error, screenNum, userMessage) {
        console.error(`[App] Error:`, error);
        if (this.ui) {
            this.ui.showWarning(screenNum, userMessage || "An unexpected error occurred. Please try again.");
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
            if (screenId === SCREEN_MAP.INCOME) {
                stateUpdate = FinanceOrchestrator.calculateRatio(this.store.data);
            }
            if (screenId === SCREEN_MAP.PROPERTY) {
                Object.assign(stateUpdate, FinanceOrchestrator.populateEstimates(this.store.data));
                Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
            }
            if (screenId === SCREEN_MAP.MORTGAGE) {
                Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
            }
            if (screenId === SCREEN_MAP.COMMITTED) {
                this.renderResults();
            }

            if (Object.keys(stateUpdate).length > 0) {
                this.store.update(stateUpdate);
                this.syncCalculatedFields(stateUpdate);
            }

            const isScreenValid = this.form.validateScreen(screenId);
            const screenNum = parseInt(screenId.split('-')[1]);
            
            if (!isScreenValid) {
                this.ui.showWarning(screenNum, "Please ensure all required fields are valid.");
                return;
            }

            this.ui.hideWarning(screenNum);

            const nextScreenId = NEXT_SCREEN_MAP[screenId];
            if (nextScreenId) {
                this.ui.switchScreen(nextScreenId);
            }
        } catch (error) {
            this.handleError(error, parseInt(screenId.split('-')[1]), "Unable to proceed to the next step.");
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
            
            // Fast unregister all service workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
            
            window.location.hash = '';
            window.location.replace(window.location.origin + window.location.pathname);
        } catch (error) {
            console.error(`[App] Error during cache clear:`, error);
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
