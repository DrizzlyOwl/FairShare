/**
 * Calculations.js
 * High-level orchestration of the financial calculation pipeline.
 * Pure functional logic, decoupled from the DOM and state management.
 */

import FinanceEngine from './FinanceEngine.js';

export default class CalculationEngine {
    /**
     * Executes the full calculation pipeline and returns a structured summary.
     * @param {Object} state - The current application state.
     * @returns {Object} Structured results for upfront and monthly costs.
     */
    static getSummary(state) {
        // 1. Upfront Costs
        const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
        const legalFees = state.propertyPrice > 1000000 ? 2500 : (state.propertyPrice > 500000 ? 1800 : 1200);
        const totalUpfront = state.totalEquity + sdlt + legalFees + (state.mortgageFees || 0);

        const upfrontRatio = state.depositSplitProportional ? state.ratioP1 : 0.5;
        const upfrontP1 = totalUpfront * upfrontRatio;
        const upfrontP2 = totalUpfront * (1 - upfrontRatio);

        // 2. Monthly Costs
        const getSplit = (key, val) => {
            const pref = state.splitTypes[key] || 'yes';
            const r = pref === 'yes' ? state.ratioP1 : 0.5;
            return { p1: val * r, p2: val * (1 - r), total: val };
        };

        const costs = {
            councilTax: getSplit('councilTax', state.councilTaxCost || 0),
            energy: getSplit('energy', state.energyCost || 0),
            water: getSplit('water', state.waterBill || 0),
            broadband: getSplit('broadband', state.broadbandCost || 0),
            groceries: getSplit('groceries', state.groceriesCost || 0),
            childcare: getSplit('childcare', state.childcareCost || 0),
            insurance: getSplit('insurance', state.insuranceCost || 0),
            otherShared: getSplit('otherShared', state.otherSharedCosts || 0),
            mortgage: { 
                p1: state.monthlyMortgagePayment * state.ratioP1, 
                p2: state.monthlyMortgagePayment * state.ratioP2,
                total: state.monthlyMortgagePayment
            }
        };

        const totalMonthlyBill = Object.values(costs).reduce((acc, c) => acc + c.total, 0);
        const totalP1 = Object.values(costs).reduce((acc, c) => acc + c.p1, 0);
        const totalP2 = Object.values(costs).reduce((acc, c) => acc + c.p2, 0);

        return {
            upfront: {
                sdlt,
                legalFees,
                total: totalUpfront,
                p1: upfrontP1,
                p2: upfrontP2
            },
            monthly: {
                costs,
                total: totalMonthlyBill,
                p1: totalP1,
                p2: totalP2
            }
        };
    }
}
