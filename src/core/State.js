/**
 * State.js
 * Manages application state, persistence, and reactive updates.
 */

import Logger from '../utils/Logger.js';

export const INITIAL_STATE = {
    version: 1,
    salaryP1: 0,
    salaryP2: 0,
    salaryType: 'gross', // 'gross' or 'net'
    pensionP1: 0,
    pensionP2: 0,
    studentLoanP1: 'none',
    studentLoanP2: 'none',
    ratioP1: 0.5,
    ratioP2: 0.5,
    propertyPrice: 0,
    depositPercentage: 10,
    depositAmount: 0,
    depositType: 'percentage', // 'percentage' or 'amount'
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
    mortgageInterestRate: 5,
    mortgageTerm: 25,
    monthlyMortgagePayment: 0,
    totalRepayment: 0,
    postcode: '',
    isNorth: false,
    regionCode: 'EN', // EN, SC, WA, NI
    taxBand: '',
    beds: 2,
    baths: 1,
    homeType: 'first',
    isFTB: false,
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

/**
 * Migration registry.
 * Maps target version to a migration function.
 */
const MIGRATIONS = {
    /**
     * Version 1: Initial versioned state.
     * Ensures all keys from INITIAL_STATE exist in older cached data.
     */
    1: (data) => {
        return { ...INITIAL_STATE, ...data, version: 1 };
    }
};

export default class State extends Logger {
    #data;
    #onUpdate;
    #urlService;
    #persistTimeout;
    #CACHE_KEY = 'fairshare_cache';

    /**
     * @param {Object} initialState - The base data structure.
     * @param {Function} onUpdateCallback - Triggered on state change.
     * @param {UrlService} urlService - Optional utility for URL synchronization.
     */
    constructor(initialState = INITIAL_STATE, onUpdateCallback = null, urlService = null) {
        super('State');
        this.#onUpdate = onUpdateCallback;
        this.#urlService = urlService;
        // Use a non-proxied object for the initial internal data
        const data = { ...initialState };
        
        const self = this;
        // Map to cache proxies for nested objects to prevent memory leaks and redundant object creation
        const proxyCache = new WeakMap();

        const createProxy = (target) => {
            if (proxyCache.has(target)) return proxyCache.get(target);

            const handler = {
                set: (target, prop, value) => {
                    if (target[prop] === value) return true;
                    self.debug(`Property "${prop}" changed:`, target[prop], "->", value);
                    target[prop] = value;
                    self.persist();
                    // Avoid triggering onUpdate for every field if we're in a bulk update
                    if (self.#onUpdate && !self.#isBatchUpdating) {
                        self.#onUpdate(self.#data);
                    }
                    return true;
                },
                get: (target, prop) => {
                    const value = target[prop];
                    if (typeof value === 'object' && value !== null) {
                        return createProxy(value);
                    }
                    return value;
                }
            };

            const proxy = new Proxy(target, handler);
            proxyCache.set(target, proxy);
            return proxy;
        };

        this.#data = createProxy(data);
    }

    #isBatchUpdating = false;

    /**
     * Replaces multiple state properties at once.
     * @param {Object} newData - Key-value pairs to merge into state.
     */
    update(newData) {
        this.#isBatchUpdating = true;
        this.debug(`Batch Update:`, newData);
        try {
            Object.assign(this.#data, newData);
        } finally {
            this.#isBatchUpdating = false;
        }
        
        this.persist();
        if (this.#onUpdate) this.#onUpdate(this.#data);
    }

    /**
     * Saves current state to localStorage with a short throttle.
     * Prevents UI jank and redundant writes during fast typing.
     */
    persist() {
        if (typeof window !== 'undefined' && window.Cypress && !window.__CYPRESS_PERSISTENCE__) return;
        
        // Immediate persistence for tests to avoid race conditions with cy.reload()
        if (typeof window !== 'undefined' && window.__CYPRESS_PERSISTENCE__) {
            localStorage.setItem(this.#CACHE_KEY, JSON.stringify(this.#data));
            if (this.#urlService) this.#urlService.updateUrl(this.#data);
            return;
        }

        if (this.#persistTimeout) {
            clearTimeout(this.#persistTimeout);
        }
        
        this.#persistTimeout = setTimeout(() => {
            localStorage.setItem(this.#CACHE_KEY, JSON.stringify(this.#data));
            if (this.#urlService) this.#urlService.updateUrl(this.#data);
            this.#persistTimeout = null;
        }, 500);
    }

    /**
     * Hydrates state from localStorage if available.
     * Applies migrations if the cached version is outdated.
     * @returns {Object} The current state after hydration.
     */
    hydrate() {
        if (typeof window !== 'undefined' && window.Cypress && !window.__CYPRESS_PERSISTENCE__) return this.#data;

        const cached = localStorage.getItem(this.#CACHE_KEY);
        if (cached) {
            try {
                let parsed = JSON.parse(cached);
                const currentVersion = INITIAL_STATE.version;
                const cachedVersion = parsed.version || 0;

                if (cachedVersion < currentVersion) {
                    this.info(`Migrating state from v${cachedVersion} to v${currentVersion}`);
                    parsed = this.#migrate(parsed, cachedVersion, currentVersion);
                }

                this.update(parsed);
            } catch (e) {
                this.error("Failed to hydrate state:", e);
            }
        }
        return this.#data;
    }

    /**
     * Runs sequential migrations from startVersion to targetVersion.
     * @param {Object} data - The state data to migrate.
     * @param {number} startVersion - The current version of the data.
     * @param {number} targetVersion - The version to migrate to.
     * @returns {Object} The migrated data.
     */
    #migrate(data, startVersion, targetVersion) {
        let migratedData = { ...data };
        for (let v = startVersion + 1; v <= targetVersion; v++) {
            if (MIGRATIONS[v]) {
                this.debug(`Applying migration to v${v}`);
                migratedData = MIGRATIONS[v](migratedData);
            }
        }
        return migratedData;
    }

    /**
     * Clears local storage and resets state to INITIAL_STATE.
     * Cancels any pending throttled persistence.
     */
    clear() {
        if (this.#persistTimeout) {
            clearTimeout(this.#persistTimeout);
            this.#persistTimeout = null;
        }
        localStorage.removeItem(this.#CACHE_KEY);
        this.update(INITIAL_STATE);
    }

    /**
     * Accessor for current application data.
     * @returns {Object}
     */
    get data() {
        return this.#data;
    }
}

