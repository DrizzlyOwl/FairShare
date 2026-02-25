/**
 * FinanceEngine.js
 * Pure functional engine for UK-specific financial calculations.
 * Zero DOM dependencies.
 */

export const TAX_BRACKETS = {
    EN: {
        standard: [
            { upto: 125000, rate: 0 },
            { upto: 250000, rate: 0.02 },
            { upto: 925000, rate: 0.05 },
            { upto: 1500000, rate: 0.10 },
            { over: 1500000, rate: 0.12 }
        ],
        ftb: [
            { upto: 300000, rate: 0 },
            { upto: 500000, rate: 0.05 }
        ],
        additionalSurcharge: 0.03
    },
    SC: {
        standard: [
            { upto: 145000, rate: 0 },
            { upto: 250000, rate: 0.02 },
            { upto: 325000, rate: 0.05 },
            { upto: 750000, rate: 0.10 },
            { over: 750000, rate: 0.12 }
        ],
        ftbRelief: 600,
        additionalSurcharge: 0.04
    },
    WA: {
        standard: [
            { upto: 180000, rate: 0 },
            { upto: 250000, rate: 0.035 },
            { upto: 400000, rate: 0.05 },
            { upto: 750000, rate: 0.075 },
            { upto: 1500000, rate: 0.10 },
            { over: 1500000, rate: 0.12 }
        ],
        additionalSurcharge: 0.03
    }
};

export default class FinanceEngine {
    /**
     * Calculates tax based on tiered brackets.
     * @param {number} price - Value to be taxed.
     * @param {Array} brackets - Array of {upto, rate} objects.
     * @returns {number}
     */
    static calculateTieredTax(price, brackets) {
        let tax = 0;
        let prevLimit = 0;
        for (const bracket of brackets) {
            if (price > prevLimit) {
                const limit = bracket.upto || Infinity;
                const taxableAmount = Math.min(price, limit) - prevLimit;
                tax += taxableAmount * bracket.rate;
                if (price <= limit) break;
                prevLimit = limit;
            }
        }
        return tax;
    }

    /**
     * Estimates monthly take-home pay based on 2025/26 UK rules.
     * @param {number} salary - Annual gross salary.
     * @param {string} _region - 'EN', 'SC', 'WA', 'NI'.
     * @returns {Object} { bandName, monthlyNet }
     */
    static calculateTakeHome(salary, _region = 'EN') {
        if (salary <= 0) return { bandName: 'Personal Allowance', monthlyNet: 0 };

        let tax = 0;
        let bandName = 'Personal Allowance';
        const pa = 12570;
        const basicLimit = 50270;
        const higherLimit = 125140;
        
        let actualAllowance = pa;
        if (salary > 100000) {
            actualAllowance = Math.max(0, pa - ((salary - 100000) / 2));
        }

        if (salary > higherLimit) {
            bandName = 'Additional Rate';
            tax = ((basicLimit - pa) * 0.2) + ((higherLimit - basicLimit) * 0.4) + ((salary - higherLimit) * 0.45);
        } else if (salary > basicLimit) {
            bandName = 'Higher Rate';
            tax = ((basicLimit - pa) * 0.2) + ((salary - basicLimit) * 0.4);
        } else if (salary > actualAllowance) {
            bandName = 'Basic Rate';
            tax = (salary - actualAllowance) * 0.2;
        }

        let ni = 0;
        if (salary > 50270) {
            ni = ((50270 - 12570) * 0.08) + ((salary - 50270) * 0.02);
        } else if (salary > 12570) {
            ni = (salary - 12570) * 0.08;
        }

        return { bandName, monthlyNet: (salary - tax - ni) / 12 };
    }

    /**
     * Calculates Stamp Duty (SDLT in England/NI, LBTT in Scotland, LTT in Wales).
     * @param {number} price - Property purchase price.
     * @param {string} region - Region code ('EN', 'SC', 'WA').
     * @param {string} homeType - 'first' or 'second' home.
     * @param {boolean} isFTB - Whether the buyer is a First Time Buyer.
     * @returns {number} Calculated tax amount in GBP.
     */
    static calculateStampDuty(price, region, homeType, isFTB) {
        if (price <= 0) return 0;
        const regionBrackets = TAX_BRACKETS[region] || TAX_BRACKETS.EN;
        const isAdditional = homeType === 'second';
        
        if (isFTB && !isAdditional) {
            if (region === 'EN' && price <= 500000) {
                return this.calculateTieredTax(price, regionBrackets.ftb);
            }
            if (region === 'SC') {
                const standardTax = this.calculateTieredTax(price, regionBrackets.standard);
                return Math.max(0, standardTax - regionBrackets.ftbRelief);
            }
        }
        
        let tax = this.calculateTieredTax(price, regionBrackets.standard);
        if (isAdditional && price >= 40000) {
            tax += price * regionBrackets.additionalSurcharge;
        }
        return Math.floor(tax);
    }

    /**
     * Calculates monthly mortgage repayment using standard amortization formula.
     * @param {number} principal - Loan amount.
     * @param {number} annualRate - Annual interest rate (e.g. 4.5).
     * @param {number} termYears - Mortgage term in years.
     * @returns {Object} { monthlyPayment, totalRepayment }
     */
    static calculateMortgage(principal, annualRate, termYears) {
        if (principal <= 0 || annualRate <= 0 || termYears <= 0) {
            return { monthlyPayment: 0, totalRepayment: 0 };
        }
        const monthlyRate = (annualRate / 100) / 12;
        const numberOfPayments = termYears * 12;
        const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        return {
            monthlyPayment,
            totalRepayment: monthlyPayment * numberOfPayments
        };
    }
}
