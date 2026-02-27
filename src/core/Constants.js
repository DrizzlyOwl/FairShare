/**
 * Constants.js
 * Centralized configuration and business rule definitions for FairShare.
 */

import { deepFreeze } from '../utils/Helpers.js';

/**
 * Income Tax Configuration for 2025/26 tax year.
 * Thresholds are total annual income levels.
 */
export const INCOME_TAX_CONFIG = deepFreeze({
    EN: {
        personalAllowance: 12570,
        taperThreshold: 100000,
        bands: [
            { upto: 50270, rate: 0.20, name: 'Basic Rate' },
            { upto: 125140, rate: 0.40, name: 'Higher Rate' },
            { upto: Infinity, rate: 0.45, name: 'Additional Rate' }
        ]
    },
    SC: {
        personalAllowance: 12570,
        taperThreshold: 100000,
        bands: [
            { upto: 14876, rate: 0.19, name: 'Starter Rate' },
            { upto: 26561, rate: 0.20, name: 'Basic Rate' },
            { upto: 43662, rate: 0.21, name: 'Intermediate Rate' },
            { upto: 75000, rate: 0.42, name: 'Higher Rate' },
            { upto: 125140, rate: 0.45, name: 'Advanced Rate' },
            { upto: Infinity, rate: 0.47, name: 'Top Rate' }
        ]
    }
});

/**
 * National Insurance Configuration for 2025/26 tax year (UK-wide).
 */
export const NI_CONFIG = deepFreeze({
    lowerThreshold: 12570,
    upperThreshold: 50270,
    standardRate: 0.08,
    higherRate: 0.02
});

/**
 * Property Tax (Stamp Duty) Brackets by region.
 * Includes EN (SDLT), SC (LBTT), and WA (LTT).
 */
export const TAX_BRACKETS = deepFreeze({
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
});

/**
 * Regional mapping and utility cost heuristics based on postcode prefixes.
 */
export const REGIONS = deepFreeze({
    NI: { name: 'Northern Ireland', prefixes: ['BT'], cost: 0, code: 'NI' },
    SCOTLAND: { name: 'Scotland', prefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'HS', 'IV', 'KA', 'KW', 'KY', 'ML', 'PA', 'PH', 'TD', 'ZE'], cost: 18, code: 'SC' },
    WALES: { name: 'Wales', prefixes: ['CF', 'LD', 'LL', 'NP', 'SA', 'SY'], cost: 24, code: 'WA' },
    SOUTH_WEST: { name: 'South West', prefixes: ['BA', 'BH', 'BS', 'DT', 'EX', 'PL', 'SN', 'SP', 'TA', 'TQ', 'TR'], cost: 22, code: 'EN' },
    SOUTH: { name: 'South', prefixes: ['BN', 'CT', 'GU', 'ME', 'OX', 'PO', 'RG', 'RH', 'SL', 'TN'], cost: 20, code: 'EN' },
    LONDON: { name: 'London', prefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC', 'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD'], cost: 18, code: 'EN' },
    EAST: { name: 'East of England', prefixes: ['AL', 'CB', 'CM', 'CO', 'EN', 'HP', 'IP', 'LU', 'NR', 'RM', 'SG', 'SS'], cost: 17, code: 'EN' },
    MIDLANDS: { name: 'Midlands', prefixes: ['B', 'CV', 'DE', 'DY', 'HR', 'LE', 'LN', 'NG', 'NN', 'ST', 'SY', 'TF', 'WR', 'WS', 'WV'], cost: 16, code: 'EN' },
    NORTH: { name: 'North of England', prefixes: ['BB', 'BD', 'BL', 'CA', 'CH', 'CW', 'DH', 'DL', 'DN', 'FY', 'HD', 'HG', 'HU', 'HX', 'L', 'LA', 'LS', 'M', 'NE', 'OL', 'PR', 'S', 'SK', 'SR', 'TS', 'WA', 'WF', 'WN', 'YO'], cost: 15, code: 'EN' }
});

/**
 * Optimized lookup map for postcode prefixes.
 * Generated from REGIONS at runtime to provide O(1) access.
 */
const prefixEntries = [];
for (const [key, region] of Object.entries(REGIONS)) {
    region.prefixes.forEach(prefix => {
        prefixEntries.push([prefix, { ...region, key }]);
    });
}
export const PREFIX_MAP = deepFreeze(Object.fromEntries(prefixEntries));

/**
 * Default monthly price estimates for Council Tax bands.
 */
export const BAND_PRICES = deepFreeze({ 'A': 110, 'B': 128, 'C': 146, 'D': 165, 'E': 201, 'F': 238, 'G': 275, 'H': 330 });

/**
 * Definition of all form inputs managed by the orchestrator.
 */
export const FORM_FIELDS = deepFreeze([
    { id: 'salaryP1', type: 'number' },
    { id: 'salaryP2', type: 'number' },
    { id: 'postcode', type: 'text' },
    { id: 'propertyPrice', type: 'number' },
    { id: 'bedrooms', type: 'number', key: 'beds' },
    { id: 'bathrooms', type: 'number', key: 'baths' },
    { id: 'councilTaxCost', type: 'number' },
    { id: 'energyCost', type: 'number' },
    { id: 'waterBill', type: 'number' },
    { id: 'broadbandCost', type: 'number' },
    { id: 'groceriesCost', type: 'number' },
    { id: 'childcareCost', type: 'number' },
    { id: 'insuranceCost', type: 'number' },
    { id: 'otherSharedCosts', type: 'number' },
    { id: 'depositPercentage', type: 'number' },
    { id: 'depositAmount', type: 'number' },
    { id: 'mortgageInterestRate', type: 'number' },
    { id: 'mortgageTerm', type: 'number' },
    { id: 'mortgageFees', type: 'number' }
]);

/**
 * Identifier map for application screens.
 */
export const SCREEN_MAP = deepFreeze({
    LANDING: 'screen-1',
    INCOME: 'screen-2',
    PROPERTY: 'screen-3',
    MORTGAGE: 'screen-4',
    UTILITIES: 'screen-5',
    COMMITTED: 'screen-6',
    RESULTS: 'screen-7'
});
