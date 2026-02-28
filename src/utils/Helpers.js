/**
 * Helpers.js
 * Consolidated utility functions for formatting, UI generation, and execution control.
 */

const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const currencyFormatterDecimals = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

/**
 * Formats a number as GBP currency.
 * @param {number} num - The number to format.
 * @param {number} [decimals=0] - Number of decimal places (0 or 2).
 * @returns {string} Formatted currency string.
 */
export const formatCurrency = (num, decimals = 0) => {
    return decimals === 0 ? currencyFormatter.format(num) : currencyFormatterDecimals.format(num);
};

/**
 * Simple debounce implementation for execution control.
 * Bypasses delay in testing environments (Cypress).
 * @param {Function} func - Function to debounce.
 * @param {number} wait - Wait time in ms.
 * @returns {Function}
 */
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        const isTest = typeof globalThis !== 'undefined' && (globalThis.Cypress || globalThis.window?.Cypress);
        if (isTest) {
            return func.apply(this, args);
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

/**
 * Recursively freezes an object and its nested properties.
 * @param {Object} obj - The object to freeze.
 * @returns {Object} The frozen object.
 */
export const deepFreeze = (obj) => {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const value = obj[prop];
        if (
            value !== null &&
            (typeof value === 'object' || typeof value === 'function') &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value);
        }
    });
    return obj;
};
