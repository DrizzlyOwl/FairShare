/**
 * main.js
 * Application entry point and orchestrator.
 */

import State, { INITIAL_STATE } from './core/State.js';
import FinanceOrchestrator from './core/FinanceOrchestrator.js';
import ApiService from './services/ApiService.js';
import UrlService from './services/UrlService.js';
import UIManager from './ui/UIManager.js';
import ThemeManager from './ui/ThemeManager.js';
import NavigationController from './ui/NavigationController.js';
import FormController from './ui/FormController.js';
import PWAInstaller from './ui/PWAInstaller.js';
import { formatCurrency } from './utils/Helpers.js';
import CSV from './ui/Export.js';
import { FORM_FIELDS, BAND_PRICES, SCREEN_MAP, NEXT_SCREEN_MAP } from './core/Constants.js';

import Logger from './utils/Logger.js';

window.DEBUG = ['localhost', '127.0.0.1'].includes(window.location.hostname);

class FairShareApp extends Logger {
    #ui = null;
    #store = null;
    #themeManager = null;
    #nav = null;
    #form = null;
    #pwaInstaller = null;
    #orchestrator = null;
    #urlService = null;
    #csv = null;
    #elements = {};

    constructor() {
        super('App');
    }

    /**
     * Initializes the application, caches elements, and sets up controllers.
     */
    init() {
        this.info('Initializing FairShare...');
        if (window.DEBUG) this.debug('Debug mode is enabled.');
        this.cacheElements();
        this.hideLoader();
        
        // 1. Core Logic & Persistence
        this.#orchestrator = new FinanceOrchestrator();
        this.#urlService = new UrlService();
        this.#csv = new CSV();
        this.#store = new State(INITIAL_STATE, (data) => this.#ui.render(data), this.#urlService);

        // 2. UI Orchestration
        this.#ui = new UIManager(this.#elements, BAND_PRICES, (id) => this.#nav.updatePagination(id));
        this.#themeManager = new ThemeManager(this.#elements);
        
        // 3. Controllers
        this.#nav = new NavigationController(this, this.#ui, this.#elements);
        this.#form = new FormController(this, this.#ui, this.#store, this.#elements);
        this.#pwaInstaller = new PWAInstaller(this.#elements.installButton);
        
        // 4. Setup Initial State (Prioritize URL for sharing support)
        const urlState = this.#urlService.getStateFromUrl();
        if (urlState) {
            this.info('Hydrating state from URL hash.');
            this.#store.update(urlState);
        } else {
            this.#store.hydrate();
        }

        // 5. Initialize Theme
        this.#themeManager.init();

        this.initPWA();
        this.bindGlobalEvents();
        this.syncUIWithState();
        this.updateEfficiencyTip();
        
        // Hide all screens initially to ensure clean state
        document.querySelectorAll('main section.screen').forEach(el => el.setAttribute('hidden', ''));

        // Initial screen transition
        const initialScreen = window.location.hash && !window.location.hash.includes('state=') 
            ? window.location.hash.replace('#', '') 
            : SCREEN_MAP.LANDING;
            
        this.#ui.switchScreen(this.#nav.findScreenByHeadingId(initialScreen) || SCREEN_MAP.LANDING, true);
    }

    /**
     * Initializes PWA-specific listeners and features.
     */
    initPWA() {
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
        
        // Check initial status
        this.updateOnlineStatus();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js')
                    .then(reg => this.debug('Service Worker: Registered (Scope: ' + reg.scope + ')'))
                    .catch(err => this.error('Service Worker: Registration Failed', err));
            });
        }
    }

    /**
     * Toggles visibility of the efficiency tip based on device type.
     */
    updateEfficiencyTip() {
        const efficiencyTip = this.#elements.efficiencyTip;
        if (efficiencyTip) {
            const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
            if (isTouchDevice) {
                efficiencyTip.setAttribute('hidden', '');
            } else {
                efficiencyTip.removeAttribute('hidden');
            }
        }
    }

    /**
     * Updates the UI to reflect current online/offline status.
     */
    updateOnlineStatus() {
        const isOffline = !navigator.onLine;
        if (this.#elements.offlineIndicator) {
            if (isOffline) this.#elements.offlineIndicator.removeAttribute('hidden');
            else this.#elements.offlineIndicator.setAttribute('hidden', '');
        }
    }

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
    }

    /**
     * Scans the DOM for elements with [data-ui] and populates the local cache.
     */
    cacheElements() {
        this.#elements = {};
        document.querySelectorAll('[data-ui]').forEach(el => {
            const key = el.dataset.ui;
            this.#elements[key] = el;
        });
    }

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
    }

    /**
     * Synchronizes complex UI elements with current application state.
     */
    syncUIWithState() {
        const state = this.#store.data;

        // Sync standard form fields
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;
            const val = state[field.key || field.id];
            if (val !== undefined) el.value = val;
        });

        // Sync radio groups
        const radios = ['salaryType', 'depositType', 'homeType', 'depositSplitType', 'buyerStatus', 'studentLoanP1', 'studentLoanP2'];
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

        this.#form.updateFTBVisibility();
        this.#form.updateSalaryTypeLabels(state.salaryType);
        this.#form.updatePropertyPriceDisplay(state.propertyPrice, false);
        
        // Let UIManager handle initial calculations sync
        const update = this.#orchestrator.calculateEquityDetails(this.#store.data);
        const estimates = this.#orchestrator.populateEstimates(this.#store.data);
        
        this.#store.update(update);
        this.#store.update(estimates);
        this.#store.update(this.#orchestrator.calculateRatio(this.#store.data));
        
        // Trigger manual render for non-observed calculated fields
        this.syncCalculatedFields({ ...update, ...estimates });
    }

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
            if (update[id] !== undefined && this.#elements[id]) {
                this.#elements[id].value = update[id];
            }
        });
    }

    /**
     * Renders upfront cash requirement details to the UI.
     */
    renderUpfrontWorkings(sdlt, legalFees) {
        const state = this.#store.data;
        const totalUpfront = state.totalEquity + sdlt + legalFees + (state.mortgageFees || 0);
        
        if (this.#elements.sdltEstimate) this.#elements.sdltEstimate.value = sdlt.toLocaleString();
        if (this.#elements.legalFeesEstimate) this.#elements.legalFeesEstimate.value = legalFees.toLocaleString();
        if (this.#elements.sdltDisplay) this.#elements.sdltDisplay.innerText = formatCurrency(sdlt);
        if (this.#elements.legalFeesDisplay) this.#elements.legalFeesDisplay.innerText = formatCurrency(legalFees);
        if (this.#elements.mortgageFeesDisplay) this.#elements.mortgageFeesDisplay.innerText = formatCurrency(state.mortgageFees || 0);
        if (this.#elements.totalEquityDisplay) this.#elements.totalEquityDisplay.innerText = formatCurrency(state.totalEquity);
        if (this.#elements.totalUpfrontDisplay) this.#elements.totalUpfrontDisplay.innerText = formatCurrency(totalUpfront);
    }

    /**
     * Handles async property price estimation.
     */
    async handlePriceEstimation() {
        const postcode = this.#elements.postcode.value.trim();
        const bedrooms = parseInt(this.#elements.bedrooms.value) || 2;
        if (!postcode) return;

        this.#ui.hideWarning(3);
        
        try {
            const result = await ApiService.getEstimatedPropertyPrice(postcode, bedrooms);
            const price = typeof result === 'object' ? result.price : result;
            
            this.#store.update({ propertyPrice: price });
            this.#elements.propertyPrice.value = price;
            this.#form.updatePropertyPriceDisplay(price, !!result.isEstimated);
            
            const update = this.#orchestrator.calculateEquityDetails(this.#store.data);
            this.#store.update(update);
            this.syncCalculatedFields(update);
        } catch (error) {
            this.handleError(error, 3, "Failed to estimate property price. Please enter manually.");
        }
    }

    /**
     * Standardized error handling for user-facing issues.
     */
    handleError(error, screenNum, userMessage) {
        this.error(`Error:`, error);
        if (this.#ui) {
            this.#ui.showWarning(screenNum, userMessage || "An unexpected error occurred. Please try again.");
        }
    }

    /**
     * Calculates the final bill splitting breakdown and transitions to results.
     */
    renderResults() {
        const summary = this.#orchestrator.getFinalSummary(this.#store.data);
        this.#ui.renderResultsSummary(summary, this.#store.data);
        this.#ui.renderCalculationWorkings(this.#store.data);
    }

    /**
     * Validates current screen data and transitions to the next screen.
     */
    async validateAndNext(screenId) {
        try {
            this.#form.forceStateSync();

            let stateUpdate = {};
            if (screenId === SCREEN_MAP.INCOME) {
                stateUpdate = this.#orchestrator.calculateRatio(this.#store.data);
            }
            if (screenId === SCREEN_MAP.PROPERTY) {
                Object.assign(stateUpdate, this.#orchestrator.populateEstimates(this.#store.data));
                Object.assign(stateUpdate, this.#orchestrator.calculateEquityDetails(this.#store.data));
            }
            if (screenId === SCREEN_MAP.MORTGAGE) {
                Object.assign(stateUpdate, this.#orchestrator.calculateEquityDetails(this.#store.data));
            }
            if (screenId === SCREEN_MAP.COMMITTED) {
                this.renderResults();
            }

            if (Object.keys(stateUpdate).length > 0) {
                this.#store.update(stateUpdate);
                this.syncCalculatedFields(stateUpdate);
            }

            const isScreenValid = this.#form.validateScreen(screenId);
            const screenNum = parseInt(screenId.split('-')[1]);
            
            if (!isScreenValid) {
                this.#ui.showWarning(screenNum, "Please ensure all required fields are valid.");
                return;
            }

            this.#ui.hideWarning(screenNum);

            const nextScreenId = NEXT_SCREEN_MAP[screenId];
            if (nextScreenId) {
                this.#ui.switchScreen(nextScreenId);
            }
        } catch (error) {
            this.handleError(error, parseInt(screenId.split('-')[1]), "Unable to proceed to the next step.");
        }
    }

    /**
     * Navigates to the landing screen.
     */
    goHome() {
        this.#ui.switchScreen(SCREEN_MAP.LANDING);
    }

    /**
     * Clears application state and performs a clean reload.
     */
    async clearCache() {
        try {
            const theme = localStorage.getItem('fairshare_theme');
            this.#store.clear();
            if (theme) localStorage.setItem('fairshare_theme', theme);
            
            // Fast unregister all service workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
            
            window.location.hash = '';
            window.location.replace(window.location.origin + window.location.pathname);
        } catch (error) {
            this.error(`Error during cache clear:`, error);
            window.location.reload();
        }
    }

    /**
     * Toggles the application theme.
     */
    toggleTheme() {
        this.#themeManager.toggle();
    }

    /**
     * Copies the current shareable budget URL to the clipboard.
     */
    async shareUrl() {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            this.showToast('Budget URL copied to clipboard!', 'success');
        } catch (error) {
            this.error('Failed to copy URL:', error);
            this.showToast('Failed to copy URL. Please try again.', 'error');
        }
    }

    /**
     * Displays a temporary notification message to the user.
     * @param {string} message - The text to display.
     * @param {string} [type='info'] - 'success', 'error', or 'info'.
     */
    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.innerText = message;
        toast.className = `toast toast--visible toast--${type}`;

        setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, 3000);
    }

    /**
     * Generates and downloads a CSV report.
     */
    downloadCSV() {
        try {
            this.#csv.download(this.#store.data, this.#elements.resultsTable);
        } catch (error) {
            this.error(`Error downloading CSV:`, error);
        }
    }

    /**
     * Accessor for cached elements.
     * @returns {Object}
     */
    get elements() {
        return this.#elements;
    }

    /**
     * Accessor for FinanceOrchestrator.
     * @returns {FinanceOrchestrator}
     */
    get orchestrator() {
        return this.#orchestrator;
    }

    /**
     * Accessor for ThemeManager.
     * @returns {ThemeManager}
     */
    get themeManager() {
        return this.#themeManager;
    }
}

const app = new FairShareApp();
window.app = app;
window.CSV = CSV;
window.ApiService = ApiService;
document.addEventListener('DOMContentLoaded', () => app.init());
