/**
 * State.js
 * Manages application state, persistence, and reactive updates.
 */

export const INITIAL_STATE = {
    salaryP1: 0,
    salaryP2: 0,
    salaryType: 'gross', // 'gross' or 'net'
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
    mortgageInterestRate: 0,
    mortgageTerm: 0,
    monthlyMortgagePayment: 0,
    totalRepayment: 0,
    postcode: '',
    isNorth: false,
    regionCode: 'EN', // EN, SC, WA, NI
    taxBand: '',
    beds: 0,
    baths: 0,
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

export default class State {
    #data;
    #onUpdate;
    #persistTimeout;
    #CACHE_KEY = 'fairshare_cache';

    /**
     * @param {Object} initialState - The base data structure.
     * @param {Function} onUpdateCallback - Triggered on state change.
     */
    constructor(initialState = INITIAL_STATE, onUpdateCallback = null) {
        this.#onUpdate = onUpdateCallback;
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
                    console.log(`[State] Property "${prop}" changed:`, target[prop], "->", value);
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
        console.log(`[State] Batch Update:`, newData);
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
        if (typeof window !== 'undefined' && window.Cypress) return;
        
        if (this.#persistTimeout) {
            clearTimeout(this.#persistTimeout);
        }
        
        this.#persistTimeout = setTimeout(() => {
            localStorage.setItem(this.#CACHE_KEY, JSON.stringify(this.#data));
            this.#persistTimeout = null;
        }, 500);
    }

    /**
     * Hydrates state from localStorage if available.
     * @returns {Object} The current state after hydration.
     */
    hydrate() {
        if (typeof window !== 'undefined' && window.Cypress) return this.#data;

        const cached = localStorage.getItem(this.#CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                this.update(parsed);
            } catch (e) {
                console.error("Failed to hydrate state:", e);
            }
        }
        return this.#data;
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
