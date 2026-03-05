/**
 * FinanceOrchestrator.js
 * Coordinates complex financial logic across state, engine, and services.
 * This module is DOM-independent for better testability.
 */

import FinanceEngine from './FinanceEngine.js';
import CalculationEngine from './Calculations.js';
import ApiService from '../services/ApiService.js';
import { BAND_PRICES } from './Constants.js';

import Logger from '../utils/Logger.js';

export default class FinanceOrchestrator extends Logger {
    constructor() {
        super('FinanceOrchestrator');
    }

    /**
     * Orchestrates the income ratio calculation between the engine and store.
     * @param {Object} state - Current application state.
     * @returns {Object} { ratioP1, ratioP2 }
     */
    calculateRatio(state) {
        let p1Basis = state.salaryP1 || 0;
        let p2Basis = state.salaryP2 || 0;

        if (state.salaryType === 'gross') {
            p1Basis = FinanceEngine.calculateTakeHome(p1Basis, state.regionCode, state.pensionP1 || 0, state.studentLoanP1 || 'none').monthlyNet;
            p2Basis = FinanceEngine.calculateTakeHome(p2Basis, state.regionCode, state.pensionP2 || 0, state.studentLoanP2 || 'none').monthlyNet;
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
    calculateEquityDetails(state) {
        if (!state || (state.propertyPrice || 0) <= 0) {
            return {
                totalEquity: 0,
                depositPercentage: 10,
                depositAmount: 0,
                mortgageRequired: 0,
                equityP1: 0,
                equityP2: 0,
                monthlyMortgagePayment: 0,
                totalRepayment: 0,
                _sdlt: 0,
                _legalFees: 0,
                _totalUpfront: 0
            };
        }

        let totalEquity = state.totalEquity || 0;
        let depositPerc = state.depositPercentage || 10;
        let depositAmt = state.depositAmount || 0;

        if (state.depositType === 'percentage') {
            totalEquity = state.propertyPrice * (depositPerc / 100);
            depositAmt = totalEquity;
        } else {
            totalEquity = depositAmt;
            depositPerc = (depositAmt / state.propertyPrice) * 100;
        }

        const sdlt = FinanceEngine.calculateStampDuty(state.propertyPrice, state.regionCode, state.homeType, state.isFTB);
        const legalFees = state.propertyPrice > 1000000 ? 2500 : (state.propertyPrice > 500000 ? 1800 : 1200);

        const ratioP1 = state.ratioP1 !== undefined ? state.ratioP1 : 0.5;
        const equityP1 = state.depositSplitProportional ? (totalEquity * ratioP1) : (totalEquity * 0.5);
        const equityP2 = state.depositSplitProportional ? (totalEquity * (1 - ratioP1)) : (totalEquity * 0.5);

        const mortgageRequired = state.propertyPrice - totalEquity;
        
        // Mortgage repayment calculation (part of equity flow)
        const mortgageResult = FinanceEngine.calculateMortgage(mortgageRequired, state.mortgageInterestRate || 5, state.mortgageTerm || 25);

        return {
            totalEquity,
            depositPercentage: parseFloat(depositPerc.toFixed(1)),
            depositAmount: Math.round(depositAmt),
            mortgageRequired,
            equityP1,
            equityP2,
            monthlyMortgagePayment: mortgageResult.monthlyPayment,
            totalRepayment: mortgageResult.totalRepayment,
            _sdlt: sdlt,
            _legalFees: legalFees,
            _totalUpfront: totalEquity + sdlt + legalFees + (state.mortgageFees || 0)
        };
    }

    /**
     * Populates regional utility and tax estimates.
     * @param {Object} state - Current application state.
     * @returns {Object} Updated state slice.
     */
    populateEstimates(state) {
        if (!state) return { councilTaxCost: 0, energyCost: 0, waterBill: 0, broadbandCost: 35 };

        const councilTax = BAND_PRICES[state.taxBand] || BAND_PRICES[state.band] || 0;
        let energy = 40 + ((state.beds || 2) * 25) + ((state.baths || 1) * 15);
        if (state.isNorth) energy *= 1.1;
        if (['E', 'F', 'G', 'H'].includes(state.taxBand || state.band)) energy *= 1.15;

        const water = ApiService.estimateWaterCost(state.postcode || '', state.beds || 2, state.baths || 1);

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
    getFinalSummary(state) {
        return CalculationEngine.getSummary(state);
    }
}
