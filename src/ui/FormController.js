/**
 * FormController.js
 * Manages complex input life-cycles, formatting, and screen-level validation.
 */

import FinanceOrchestrator from '../core/FinanceOrchestrator.js';
import FinanceEngine from '../core/FinanceEngine.js';
import ApiService from '../services/ApiService.js';
import Validator from '../core/Validator.js';
import { FORM_FIELDS } from '../core/Constants.js';
import { formatCurrency, debounce } from '../utils/Helpers.js';

export default class FormController {
    /**
     * @param {Object} app - Reference to the main app orchestrator.
     * @param {UIManager} ui - Reference to the UI manager.
     * @param {State} store - Reference to the application state store.
     * @param {Object} elements - Pre-populated element cache.
     */
    constructor(app, ui, store, elements) {
        this.app = app;
        this.ui = ui;
        this.store = store;
        this.elements = elements;

        this.bindEvents();
    }

    /**
     * Binds DOM input and selection events.
     */
    bindEvents() {
        // Form field event binding
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el) return;

            const debouncedUpdate = debounce(() => {
                let val = el.value;
                if (field.type === 'number') val = parseFloat(val) || 0;
                this.store.update({ [field.key || field.id]: val });
                
                // Logic side effects handled by orchestrator updates
                const stateUpdate = {};
                if (field.id === 'propertyPrice') {
                    this.updatePropertyPriceDisplay(val, false);
                    Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
                }
                if (['depositPercentage', 'depositAmount', 'mortgageInterestRate', 'mortgageTerm'].includes(field.id)) {
                    Object.assign(stateUpdate, FinanceOrchestrator.calculateEquityDetails(this.store.data));
                }
                
                if (Object.keys(stateUpdate).length > 0) {
                    this.store.update(stateUpdate);
                    this.app.syncCalculatedFields(stateUpdate);
                }
            }, 300);

            el.addEventListener('input', () => {
                this.clearFieldError(field.id);
                if (field.id === 'postcode') {
                    this.formatPostcode(el);
                    this.handlePostcodeChange(el.value);
                }
                if (field.id === 'salaryP1' || field.id === 'salaryP2') {
                    this.updateTaxEstimate(field.id === 'salaryP1' ? 'P1' : 'P2');
                    this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
                }
                debouncedUpdate();
            });
        });

        // Toggle / Radio Listeners
        document.querySelectorAll('input[name="salaryType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ salaryType: radio.value });
                this.updateSalaryTypeLabels(radio.value);
                this.updateTaxEstimate('P1');
                this.updateTaxEstimate('P2');
                this.store.update(FinanceOrchestrator.calculateRatio(this.store.data));
            };
        });

        document.querySelectorAll('input[name="depositType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ depositType: radio.value });
                if (radio.value === 'percentage') {
                    this.elements.depositPercContainer.removeAttribute('hidden');
                    this.elements.depositAmtContainer.setAttribute('hidden', '');
                } else {
                    this.elements.depositPercContainer.setAttribute('hidden', '');
                    this.elements.depositAmtContainer.removeAttribute('hidden');
                }
                const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
                this.store.update(update);
                this.app.syncCalculatedFields(update);
            };
        });

        document.querySelectorAll('input[name="taxBand"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ taxBand: radio.value });
                this.ui.updatePricePreview(radio.value);
            };
        });

        document.querySelectorAll('input[name="depositSplitType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ depositSplitProportional: radio.value === 'yes' });
                const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
                this.store.update(update);
                this.app.syncCalculatedFields(update);
            };
        });

        document.querySelectorAll('input[name="homeType"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ homeType: radio.value });
                this.updateFTBVisibility();
                const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
                this.store.update(update);
                this.app.syncCalculatedFields(update);
            };
        });

        document.querySelectorAll('input[name="buyerStatus"]').forEach(radio => {
            radio.onchange = () => {
                this.store.update({ isFTB: radio.value === 'ftb' });
                const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
                this.store.update(update);
                this.app.syncCalculatedFields(update);
            };
        });

        // Bulk Utility/Committed Toggles
        document.querySelectorAll('input[name="masterUtilities"]').forEach(radio => {
            radio.onchange = () => this.setAllSplitTypes('utilities', radio.value);
        });

        document.querySelectorAll('input[name="masterCommitted"]').forEach(radio => {
            radio.onchange = () => this.setAllSplitTypes('committed', radio.value);
        });
    }

    /**
     * Formats postcode input according to UK standards.
     * @param {HTMLInputElement} input - The input element.
     */
    formatPostcode(input) {
        const val = input.value.replace(/\s+/g, '').toUpperCase();
        if (val.length > 3) {
            input.value = val.slice(0, -3) + ' ' + val.slice(-3);
        }
    }

    /**
     * Handles postcode input changes to detect region and update announcements.
     * @param {string} postcode - The UK postcode.
     */
    handlePostcodeChange(postcode) {
        const region = ApiService.getRegionFromPostcode(postcode);
        const announce = this.elements.regionAnnouncement;
        if (!announce) return;

        if (region) {
            this.store.update({
                regionCode: region.code,
                isNorth: region.key === 'NORTH'
            });

            const text = region.key === 'NORTH'
                ? `${region.name} region detected. Heating estimates adjusted.`
                : `${region.name} region detected.`;

            announce.querySelector('.alert__text').innerText = text;
            announce.removeAttribute('hidden');
            
            // Recalculate SDLT/Legal fees as they are region-dependent
            const update = FinanceOrchestrator.calculateEquityDetails(this.store.data);
            this.store.update(update);
            this.app.syncCalculatedFields(update);
        } else {
            announce.setAttribute('hidden', '');
        }
    }

    /**
     * Updates labels and placeholders based on Gross vs Net income selection.
     */
    updateSalaryTypeLabels(type) {
        if (this.elements.salaryP1Error) this.elements.salaryP1Error.setAttribute('hidden', '');
        if (this.elements.salaryP2Error) this.elements.salaryP2Error.setAttribute('hidden', '');

        if (type === 'gross') {
            this.elements.salaryP1Label.innerText = 'Your Annual Salary (Pre-tax) *';
            this.elements.salaryP2Label.innerText = "Your Partner's Annual Salary (Pre-tax) *";
            this.elements.salaryP1.placeholder = 'e.g. 35000';
            this.elements.salaryP2.placeholder = 'e.g. 45000';
            if (this.elements.salaryP1Desc) this.elements.salaryP1Desc.innerText = 'Enter your total yearly income before any deductions.';
            if (this.elements.salaryP2Desc) this.elements.salaryP2Desc.innerText = "Enter your partner's total yearly income before any deductions.";
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Annual Income & Ratio';
        } else {
            this.elements.salaryP1Label.innerText = 'Your Monthly Take-home Pay *';
            this.elements.salaryP2Label.innerText = "Your Partner's Monthly Take-home Pay *";
            this.elements.salaryP1.placeholder = 'e.g. 2500';
            this.elements.salaryP2.placeholder = 'e.g. 3200';
            if (this.elements.salaryP1Desc) this.elements.salaryP1Desc.innerText = 'Enter your average monthly income after all taxes and deductions.';
            if (this.elements.salaryP2Desc) this.elements.salaryP2Desc.innerText = "Enter your partner's average monthly income after all taxes and deductions.";
            this.elements.wkIncomeSubtitle.innerText = '1. Combined Monthly Net Income & Ratio';
        }
    }

    /**
     * Estimates UK tax band and take-home pay based on annual salary.
     * @param {string} p - Partner identifier ('P1' or 'P2').
     */
    updateTaxEstimate(p) {
        const val = parseFloat(this.elements[`salary${p}`].value) || 0;
        const badge = document.getElementById(`salary${p}-tax-badge`);
        if (!badge) return;

        if (this.store.data.salaryType !== 'gross' || val <= 0) {
            badge.setAttribute('hidden', '');
            return;
        }

        const { bandName, monthlyNet } = FinanceEngine.calculateTakeHome(val, this.store.data.regionCode);
        badge.innerText = `${bandName} • Est. £${Math.round(monthlyNet).toLocaleString()}/mo take-home`;
        badge.removeAttribute('hidden');
    }

    /**
     * Updates visibility of First Time Buyer specific options.
     */
    updateFTBVisibility() {
        const state = this.store.data;
        const ftbContainer = document.getElementById('ftb-container');
        if (ftbContainer) {
            if (state.homeType === 'first') ftbContainer.removeAttribute('hidden');
            else ftbContainer.setAttribute('hidden', '');
        }
    }

    /**
     * Updates the UI display for estimated or manual property prices.
     * @param {number} price - Property value.
     * @param {boolean} isEstimated - Whether the price is from market data.
     */
    updatePropertyPriceDisplay(price, isEstimated) {
        const display = this.elements.propertyPriceEstimateDisplay;
        if (!display) return;
        if (price > 0) {
            const formatted = formatCurrency(price);
            const labelText = isEstimated ? 'Using estimated market price: ' : 'Using manual market price: ';
            display.innerHTML = `${labelText}<span>${formatted}</span>`;
            display.removeAttribute('hidden');
            if (this.elements.displayPropertyPrice) {
                // Remove £ symbol as it's provided by .input-group__addon
                this.elements.displayPropertyPrice.value = price.toLocaleString('en-GB');
            }
        } else {
            display.setAttribute('hidden', '');
            if (this.elements.displayPropertyPrice) {
                this.elements.displayPropertyPrice.value = '';
            }
        }
    }

    /**
     * Bulk sets split type preferences for a specific screen.
     * @param {string} screen - Target screen identifier.
     * @param {string} type - 'yes' (proportional) or 'no' (equal).
     */
    setAllSplitTypes(screen, type) {
        const groups = screen === 'utilities'
            ? ['councilTax', 'energy', 'water', 'broadband']
            : ['groceries', 'childcare', 'insurance', 'otherShared'];

        const splitTypes = { ...this.store.data.splitTypes };
        groups.forEach(group => {
            const radio = document.querySelector(`input[name="${group}SplitType"][value="${type}"]`);
            if (radio) radio.checked = true;
            splitTypes[group] = type;
        });
        this.store.update({ splitTypes });
    }

    /**
     * Clears the error state for a specific field.
     * @param {string} fieldId - ID of the field to clear.
     */
    clearFieldError(fieldId) {
        const el = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}-error`) || document.getElementById(fieldId.replace('Cost', '') + '-error');
        const group = el?.closest('.input-group');

        errorEl?.setAttribute('hidden', '');
        group?.classList.remove('input-group--error');
        
        // Also clear screen-level warnings if any field is being fixed
        const screenId = el?.closest('section.screen')?.id;
        if (screenId) {
            this.ui.hideWarning(parseInt(screenId.split('-')[1]));
        }
    }

    /**
     * Performs field-level validation for a specific screen.
     * Highlights invalid fields and toggles error messages.
     * @param {string} screenId - Target screen ID.
     * @returns {boolean} Whether the screen data is valid.
     */
    validateScreen(screenId) {
        // Ensure state is fresh before validation
        this.forceStateSync();
        
        const { isValid, errors } = Validator.validateScreen(screenId, this.store.data);

        // Map of screen fields to clear/set
        const screenFields = {
            [this.ui.SCREENS.INCOME]: ['salaryP1', 'salaryP2'],
            [this.ui.SCREENS.PROPERTY]: ['postcode', 'propertyPrice', 'taxBand'],
            [this.ui.SCREENS.MORTGAGE]: ['depositPercentage', 'depositAmount', 'mortgageInterestRate', 'mortgageTerm'],
            [this.ui.SCREENS.UTILITIES]: ['councilTaxCost', 'energyCost', 'waterBill', 'broadbandCost'],
            [this.ui.SCREENS.COMMITTED]: ['groceriesCost', 'childcareCost', 'insuranceCost', 'otherSharedCosts']
        };

        const setFieldState = (fieldId, fieldValid) => {
            const el = document.getElementById(fieldId);
            const errorEl = document.getElementById(`${fieldId}-error`) || document.getElementById(fieldId.replace('Cost', '') + '-error');
            const group = el?.closest('.input-group') || el?.closest('.segmented-control');

            if (!fieldValid) {
                errorEl?.removeAttribute('hidden');
                group?.classList.add('input-group--error');
            } else {
                errorEl?.setAttribute('hidden', '');
                group?.classList.remove('input-group--error');
            }
        };

        // Clear all errors on screen first, then re-apply based on Validator results
        (screenFields[screenId] || []).forEach(f => setFieldState(f, true));
        errors.forEach(f => setFieldState(f, false));

        return isValid;
    }

    /**
     * Forces an immediate update of the state from all current DOM input values.
     * Comprehensive sync for all field types, including radios and nested split preferences.
     */
    forceStateSync() {
        const stateUpdate = {};
        
        // 1. Sync standard form fields (text/number)
        FORM_FIELDS.forEach(field => {
            const el = document.getElementById(field.id);
            if (el) {
                let val = el.value;
                if (field.type === 'number') val = parseFloat(val) || 0;
                stateUpdate[field.key || field.id] = val;
            }
        });

        // 2. Sync ALL radio groups found in the document
        const radioNames = new Set();
        document.querySelectorAll('input[type="radio"]').forEach(r => radioNames.add(r.name));
        
        radioNames.forEach(name => {
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (checked) {
                if (name.endsWith('SplitType')) {
                    if (!stateUpdate.splitTypes) stateUpdate.splitTypes = { ...this.store.data.splitTypes };
                    const key = name.replace('SplitType', '');
                    stateUpdate.splitTypes[key] = checked.value;
                } 
                else if (name === 'buyerStatus') {
                    stateUpdate.isFTB = checked.value === 'ftb';
                }
                else {
                    stateUpdate[name] = checked.value;
                }
            }
        });

        this.store.update(stateUpdate);
    }
}
