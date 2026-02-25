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
    band: '',
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
    #CACHE_KEY = 'fairshare_cache';

    /**
     * @param {Object} initialState - The base data structure.
     * @param {Function} onUpdateCallback - Triggered on state change.
     */
    constructor(initialState = INITIAL_STATE, onUpdateCallback = null) {
        this.#onUpdate = onUpdateCallback;
        
        // Setup Proxy for automatic persistence and reactivity.
        const handler = {
            set: (target, prop, value) => {
                target[prop] = value;
                this.persist();
                if (this.#onUpdate) this.#onUpdate(this.#data);
                return true;
            },
            // Deep proxy for nested objects like splitTypes
            get: (target, prop) => {
                if (typeof target[prop] === 'object' && target[prop] !== null) {
                    return new Proxy(target[prop], handler);
                }
                return target[prop];
            }
        };

        this.#data = new Proxy({ ...initialState }, handler);
    }

    /**
     * Replaces multiple state properties at once.
     */
    update(newData) {
        Object.assign(this.#data, newData);
    }

    /**
     * Saves current state to localStorage.
     */
    persist() {
        localStorage.setItem(this.#CACHE_KEY, JSON.stringify(this.#data));
    }

    /**
     * Hydrates state from localStorage if available.
     */
    hydrate() {
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
     * Clears local storage and resets state.
     */
    clear() {
        localStorage.removeItem(this.#CACHE_KEY);
        this.update(INITIAL_STATE);
    }

    get data() {
        return this.#data;
    }
}
