/**
 * FinanceEngine.js
 * Pure functional engine for UK-specific financial calculations.
 * Zero DOM dependencies.
 */

import { INCOME_TAX_CONFIG, TAX_BRACKETS, NI_CONFIG } from './Constants.js';

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
     * @param {string} region - 'EN' (England/NI/Wales) or 'SC' (Scotland).
     * @returns {Object} { bandName, monthlyNet }
     */
    static calculateTakeHome(salary, region = 'EN') {
        if (salary <= 0) return { bandName: 'Personal Allowance', monthlyNet: 0 };

        const config = INCOME_TAX_CONFIG[region] || INCOME_TAX_CONFIG.EN;
        
        // Calculate actual personal allowance (tapered for income > £100k)
        let actualAllowance = config.personalAllowance;
        if (salary > config.taperThreshold) {
            actualAllowance = Math.max(0, config.personalAllowance - ((salary - config.taperThreshold) / 2));
        }

        // Construct dynamic bands for this specific calculation
        const dynamicBands = [
            { upto: actualAllowance, rate: 0, name: 'Personal Allowance' },
            ...config.bands
        ];

        let incomeTax = 0;
        let prevLimit = 0;
        let activeBandName = 'Personal Allowance';

        for (const band of dynamicBands) {
            const limit = band.upto ?? Infinity;
            if (limit <= prevLimit) continue; // Handle zero-width bands (e.g. £0 allowance)

            if (salary > prevLimit) {
                const taxableInThisBand = Math.min(salary, limit) - prevLimit;
                incomeTax += taxableInThisBand * band.rate;
                if (salary <= limit) {
                    activeBandName = band.name;
                }
            }
            prevLimit = limit;
        }

        // National Insurance (UK wide for 2025/26)
        let ni = 0;
        if (salary > NI_CONFIG.upperThreshold) {
            ni = ((NI_CONFIG.upperThreshold - NI_CONFIG.lowerThreshold) * NI_CONFIG.standardRate) + 
                 ((salary - NI_CONFIG.upperThreshold) * NI_CONFIG.higherRate);
        } else if (salary > NI_CONFIG.lowerThreshold) {
            ni = (salary - NI_CONFIG.lowerThreshold) * NI_CONFIG.standardRate;
        }

        return {
            bandName: activeBandName,
            monthlyNet: (salary - incomeTax - ni) / 12
        };
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
