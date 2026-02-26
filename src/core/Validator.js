/**
 * Validator.js
 * Centralized schema and validation engine for FairShare.
 * Handles data type enforcement, constraints, and multi-field rules.
 */

export const SCHEMA = {
    salaryP1: { type: 'number', min: 0, required: true },
    salaryP2: { type: 'number', min: 0, required: true },
    postcode: { type: 'string', required: true, pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}$/i },
    propertyPrice: { type: 'number', min: 1, required: true },
    taxBand: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], required: true },
    depositPercentage: { type: 'number', min: 0, max: 100 },
    depositAmount: { type: 'number', min: 0 },
    mortgageInterestRate: { type: 'number', min: 0 },
    mortgageTerm: { type: 'number', min: 1 },
    councilTaxCost: { type: 'number', min: 0 },
    energyCost: { type: 'number', min: 0 },
    waterBill: { type: 'number', min: 0 },
    broadbandCost: { type: 'number', min: 0 },
    groceriesCost: { type: 'number', min: 0 },
    childcareCost: { type: 'number', min: 0 },
    insuranceCost: { type: 'number', min: 0 },
    otherSharedCosts: { type: 'number', min: 0 }
};

export default class Validator {
    /**
     * Validates a piece of data against a specific schema entry.
     * @param {string} field - Field name.
     * @param {*} value - Value to validate.
     * @returns {boolean} Whether the field is valid.
     */
    static validateField(field, value) {
        const rule = SCHEMA[field];
        if (!rule) return true;

        if (rule.required && (value === undefined || value === null || value === '')) return false;
        
        if (rule.type === 'number') {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            if (rule.min !== undefined && num < rule.min) return false;
            if (rule.max !== undefined && num > rule.max) return false;
        }

        if (rule.type === 'string' && rule.pattern && !rule.pattern.test(value)) {
            return false;
        }

        if (rule.enum && !rule.enum.includes(value)) {
            return false;
        }

        return true;
    }

    /**
     * Executes screen-level validation including cross-field rules.
     * @param {string} screenId - The ID of the screen being validated.
     * @param {Object} data - The current application state.
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    static validateScreen(screenId, data) {
        const errors = [];
        let isValid = true;

        const addError = (field) => {
            isValid = false;
            errors.push(field);
        };

        switch (screenId) {
            case 'screen-2': // INCOME
                if (!this.validateField('salaryP1', data.salaryP1)) addError('salaryP1');
                if (!this.validateField('salaryP2', data.salaryP2)) addError('salaryP2');
                // Cross-field rule: At least one salary must be > 0
                if ((parseFloat(data.salaryP1) || 0) + (parseFloat(data.salaryP2) || 0) <= 0) {
                    addError('salaryP1');
                    addError('salaryP2');
                }
                break;

            case 'screen-3': // PROPERTY
                if (!this.validateField('postcode', data.postcode)) addError('postcode');
                if (!this.validateField('propertyPrice', data.propertyPrice)) addError('propertyPrice');
                if (!this.validateField('taxBand', data.taxBand)) addError('taxBand');
                break;

            case 'screen-4': // MORTGAGE
                if (data.depositType === 'percentage') {
                    if (!this.validateField('depositPercentage', data.depositPercentage)) addError('depositPercentage');
                } else {
                    if (!this.validateField('depositAmount', data.depositAmount)) addError('depositAmount');
                }
                if (!this.validateField('mortgageInterestRate', data.mortgageInterestRate)) addError('mortgageInterestRate');
                if (!this.validateField('mortgageTerm', data.mortgageTerm)) addError('mortgageTerm');
                break;

            case 'screen-5': // UTILITIES
                ['councilTaxCost', 'energyCost', 'waterBill', 'broadbandCost'].forEach(f => {
                    if (!this.validateField(f, data[f])) addError(f);
                });
                break;

            case 'screen-6': // LIFESTYLE
                ['groceriesCost', 'childcareCost', 'insuranceCost', 'otherSharedCosts'].forEach(f => {
                    if (!this.validateField(f, data[f])) addError(f);
                });
                break;
        }

        return { isValid, errors };
    }
}
