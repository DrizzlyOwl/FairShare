/**
 * FinanceOrchestrator.js
 * Coordinates complex financial logic across state, engine, and services.
 * This module is DOM-independent for better testability.
 */

import FinanceEngine from './FinanceEngine.js';
import CalculationEngine from './Calculations.js';
import ApiService from '../services/ApiService.js';
import { BAND_PRICES } from './Constants.js';

export default class FinanceOrchestrator {
    /**
     * Orchestrates the income ratio calculation between the engine and store.
     * @param {Object} state - Current application state.
     * @returns {Object} Updated state slice.
     */
    static calculateRatio(state) {
        console.log(`[FinanceOrchestrator] Recalculating Income Ratio based on "${state.salaryType}" salaries.`);
        let p1Basis = state.salaryP1;
        let p2Basis = state.salaryP2;

        if (state.salaryType === 'gross') {
            p1Basis = FinanceEngine.calculateTakeHome(state.salaryP1, state.regionCode).monthlyNet;
            p2Basis = FinanceEngine.calculateTakeHome(state.salaryP2, state.regionCode).monthlyNet;
        }

        const total = p1Basis + p2Basis;
        if (total > 0) {
            return { ratioP1: p1Basis / total, ratioP2: p2Basis / total };
        } else {
            return { ratioP1: 0.5, ratioP2: 0.5 };
        }
    }

    /**
     * Orchestrates property equity and deposit calculations.
     * @param {Object} state - Current application state.
     * @returns {Object} Updated state slice including equity, mortgage, and upfront details.
     */
    static calculateEquityDetails(state) {
        if (state.propertyPrice <= 0) return {};
        console.log(`[FinanceOrchestrator] Recalculating Equity and Mortgage details for property price: £${state.propertyPrice}`);

        let totalEquity = state.totalEquity;
        let depositPerc = state.depositPercentage;
        let depositAmt = state.depositAmount;

        if (state.depositType === 'percentage') {
            totalEquity = state.propertyPrice * (depositPerc / 100);
            depositAmt = totalEquity;
        } else {
            totalEquity = depositAmt;
            depositPerc = (depositAmt / state.propertyPrice) * 100;
        }

        const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
        const legalFees = state.propertyPrice > 1000000 ? 2500 : (state.propertyPrice > 500000 ? 1800 : 1200);

        const equityP1 = state.depositSplitProportional ? (totalEquity * state.ratioP1) : (totalEquity * 0.5);
        const equityP2 = state.depositSplitProportional ? (totalEquity * (1 - state.ratioP1)) : (totalEquity * 0.5);

        const mortgageRequired = state.propertyPrice - totalEquity;
        
        // Mortgage repayment calculation (part of equity flow)
        const mortgageResult = FinanceEngine.calculateMortgage(mortgageRequired, state.mortgageInterestRate, state.mortgageTerm);

        return {
            totalEquity,
            depositPercentage: parseFloat(depositPerc.toFixed(1)),
            depositAmount: Math.round(depositAmt),
            mortgageRequired,
            equityP1,
            equityP2,
            monthlyMortgagePayment: mortgageResult.monthlyPayment,
            totalRepayment: mortgageResult.totalRepayment,
            // Transient fields for UI (not usually in state but useful for downstream)
            _sdlt: sdlt,
            _legalFees: legalFees,
            _totalUpfront: totalEquity + sdlt + legalFees + state.mortgageFees
        };
    }

    /**
     * Populates regional utility and tax estimates.
     * @param {Object} state - Current application state.
     * @returns {Object} Updated state slice.
     */
    static populateEstimates(state) {
        const councilTax = BAND_PRICES[state.taxBand] || BAND_PRICES[state.band] || 0;
        let energy = 40 + (state.beds * 25) + (state.baths * 15);
        if (state.isNorth) energy *= 1.1;
        if (['E', 'F', 'G', 'H'].includes(state.taxBand || state.band)) energy *= 1.15;

        const water = ApiService.estimateWaterCost(state.postcode, state.beds, state.baths);

        return {
            councilTaxCost: councilTax,
            energyCost: Math.round(energy),
            waterBill: Math.round(water),
            broadbandCost: 35
        };
    }

    /**
     * Calculates the final bill splitting breakdown.
     * @param {Object} state - Current application state.
     * @returns {Object} Full summary object from CalculationEngine.
     */
    static getFinalSummary(state) {
        return CalculationEngine.getSummary(state);
    }
}
