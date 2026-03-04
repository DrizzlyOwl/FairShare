/**
 * UIManager.js
 * Manages the application's view state, screen transitions, and DOM updates.
 */

import { formatCurrency, formatNumber } from '../utils/Helpers.js';
import { SCREEN_MAP } from '../core/Constants.js';
import CustomSelect from './CustomSelect.js';

import Logger from '../utils/Logger.js';

export default class UIManager extends Logger {
    #elements;
    #bandPrices;
    #onScreenChange;
    #observer;
    #customSelects = new Map();

    SCREENS = SCREEN_MAP;

    /**
     * @param {Object} elements - Pre-populated element cache.
     * @param {Object} bandPrices - Regional cost reference.
     * @param {Function} onScreenChangeCallback - Called when screen transitions occur.
     */
    constructor(elements, bandPrices, onScreenChangeCallback = null) {
        super('UIManager');
        this.#elements = elements;
        this.#bandPrices = bandPrices;
        this.#onScreenChange = onScreenChangeCallback;

        this.#initObserver();
    }

    /**
     * Sets up the IntersectionObserver for scroll-triggered animations.
     */
    #initObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            this.debug('IntersectionObserver not supported. Triggering pie animation immediately.');
            this.#triggerPieAnimation();
            return;
        }

        this.#observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('pie-chart--animate');
                    this.#triggerPieAnimation();
                }
            });
        }, { threshold: 0.5 });

        if (this.#elements.ratioPieChart) {
            this.#observer.observe(this.#elements.ratioPieChart);
        }
    }

    #pieData = { p1: 0.5, p2: 0.5 };

    /**
     * Internal trigger to apply SVG dasharray values.
     */
    #triggerPieAnimation() {
        const { p1, p2 } = this.#pieData;
        const p1Perc = Math.round(p1 * 100);
        const p2Perc = Math.round(p2 * 100);

        if (this.#elements.pieSegmentP1) {
            this.#elements.pieSegmentP1.setAttribute('stroke-dasharray', `${p1Perc} 100`);
        }
        if (this.#elements.pieSegmentP2) {
            this.#elements.pieSegmentP2.setAttribute('stroke-dasharray', `${p2Perc} 100`);
            this.#elements.pieSegmentP2.setAttribute('stroke-dashoffset', `-${p1Perc}`);
        }
    }

    /**
     * Transitions to a new screen.
     * @param {string} id - The ID of the screen to switch to.
     * @param {boolean} [isInitialLoad=false] - Whether this is the first screen load.
     */
    switchScreen(id, isInitialLoad = false) {
        this.debug(`Navigating to: ${id} (Initial Load: ${isInitialLoad})`);
        const target = document.getElementById(id);
        if (!target) {
            this.error(`Target screen not found: ${id}`);
            return;
        }

        const heading = target.querySelector('h2');

        // Only update hash if not initial load and not in a test environment
        // Hash updates can trigger unwanted page cycles in some CI/Test runners
        if (!isInitialLoad && (!window.Cypress || window.__CYPRESS_PERSISTENCE__)) {
            window.location.hash = heading?.id || id;
            if (typeof window.scrollTo === 'function') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        // Hide all screens
        document.querySelectorAll('main section.screen').forEach(el => {
            el.setAttribute('hidden', '');
        });
        
        // Show target
        target.removeAttribute('hidden');
        this.debug(`Screen ${id} hidden attribute after removal: ${target.hasAttribute('hidden')}`);
        
        if (!isInitialLoad) target.focus();

        this.updateProgress(id);
        this.updateBackgroundImage(id);
        
        // Notify via callback instead of global object
        if (this.#onScreenChange) {
            this.#onScreenChange(id);
        }
    }

    /**
     * Updates progress bar and text label.
     * @param {string} id - Current screen ID.
     */
    updateProgress(id) {
        const progressMap = {
            [this.SCREENS.LANDING]: { p: 0, text: 'Step 1 of 7: Welcome' },
            [this.SCREENS.INCOME]: { p: 15, text: 'Step 2 of 7: Income' },
            [this.SCREENS.PROPERTY]: { p: 30, text: 'Step 3 of 7: Property' },
            [this.SCREENS.MORTGAGE]: { p: 45, text: 'Step 4 of 7: Mortgage & Equity' },
            [this.SCREENS.UTILITIES]: { p: 60, text: 'Step 5 of 7: Utilities' },
            [this.SCREENS.COMMITTED]: { p: 80, text: 'Step 6 of 7: Committed Spending' },
            [this.SCREENS.RESULTS]: { p: 100, text: 'Step 7 of 7: Results' }
        };

        const stepData = progressMap[id] || { p: 0, text: '' };
        if (this.#elements.progressBar) {
            this.#elements.progressBar.value = stepData.p;
            this.#elements.progressBar.setAttribute('aria-label', `Application Progress: ${stepData.text}`);
        }
        if (this.#elements.progressLabel) {
            this.#elements.progressLabel.innerText = stepData.text;
        }
    }

    /**
     * Updates the body background image based on the active screen.
     * @param {string} screenId - The active screen ID.
     */
    updateBackgroundImage(screenId) {
        const screenToVarMap = {
            [this.SCREENS.LANDING]: 'var(--bg-landing)',
            [this.SCREENS.INCOME]: 'var(--bg-income)',
            [this.SCREENS.PROPERTY]: 'var(--bg-property)',
            [this.SCREENS.MORTGAGE]: 'var(--bg-mortgage)',
            [this.SCREENS.UTILITIES]: 'var(--bg-utilities)',
            [this.SCREENS.COMMITTED]: 'var(--bg-committed)',
            [this.SCREENS.RESULTS]: 'var(--bg-results)'
        };

        const newVar = screenToVarMap[screenId];
        if (newVar) {
            document.body.style.setProperty('--bg-image', newVar);
        }
    }

    /**
     * Updates the visual ratio pie chart and legend.
     * @param {number} ratioP1 - Partner 1 share (0-1).
     * @param {number} ratioP2 - Partner 2 share (0-1).
     */
    updatePieChart(ratioP1, ratioP2) {
        this.#pieData = { p1: ratioP1, p2: ratioP2 };
        const p1Perc = Math.round(ratioP1 * 100);
        const p2Perc = Math.round(ratioP2 * 100);

        if (this.#elements.legendP1Perc) this.#elements.legendP1Perc.innerText = p1Perc + '%';
        if (this.#elements.legendP2Perc) this.#elements.legendP2Perc.innerText = p2Perc + '%';
        if (this.#elements.pieCenterText) this.#elements.pieCenterText.textContent = `${p1Perc}/${p2Perc}`;

        if (this.#elements.ratioTextDesc) {
            this.#elements.ratioTextDesc.innerText = `Income ratio is ${p1Perc}% You and ${p2Perc}% Your Partner.`;
        }

        // Trigger animation if already in view
        if (this.#elements.ratioPieChart?.classList.contains('pie-chart--animate')) {
            this.#triggerPieAnimation();
        }
    }

    /**
     * Updates the Council Tax cost preview based on selected band.
     * @param {string} band - The tax band letter (A-H).
     */
    updatePricePreview(band) {
        const cost = this.#bandPrices[band];
        this.updateAlert('band-price-display', {
            variant: 'info',
            icon: 'icon-info.svg',
            text: `Band ${band} selected. Estimated cost: ${formatCurrency(cost)} per month.`,
            hidden: false
        });
    }

    /**
     * Renders a breakdown row in the results table.
     * @param {string} key - Row identifier (e.g. 'Mortgage').
     * @param {number} total - Total monthly amount.
     * @param {number} p1 - Partner 1 share.
     * @param {number} p2 - Partner 2 share.
     */
    updateBreakdownRow(key, total, p1, p2) {
        if (this.#elements[`bd${key}Total`]) this.#elements[`bd${key}Total`].innerText = formatCurrency(total, 2);
        if (this.#elements[`bd${key}P1`]) this.#elements[`bd${key}P1`].innerText = formatCurrency(p1, 2);
        if (this.#elements[`bd${key}P2`]) this.#elements[`bd${key}P2`].innerText = formatCurrency(p2, 2);
    }

    /**
     * Performs a targeted update on an alert component without replacing the whole element.
     * @param {string} id - The alert element ID.
     * @param {Object} options - Update options {variant, icon, text, hidden}.
     */
    updateAlert(id, { variant, icon, text, hidden }) {
        const el = document.getElementById(id);
        if (!el) return;

        if (variant) {
            // Remove existing variant classes and add the new one
            el.classList.remove('alert--info', 'alert--warning', 'alert--error');
            el.classList.add(`alert--${variant}`);

            // Also update the icon variant class for BEM compliance
            const iconEl = el.querySelector('.alert__icon');
            if (iconEl) {
                iconEl.className = iconEl.className.split(' ')
                    .filter(c => !c.startsWith('alert__icon--'))
                    .join(' ');
                iconEl.classList.add(`alert__icon--${variant}`);
            }
        }

        if (icon) {
            const iconEl = el.querySelector('.alert__icon');
            if (iconEl) {
                // Remove all existing icon-- classes
                iconEl.className = iconEl.className.split(' ')
                    .filter(c => !c.startsWith('icon--'))
                    .join(' ');
                
                const iconSlug = icon.replace('icon-', '').replace('.svg', '');
                iconEl.classList.add(`icon--${iconSlug}`);
            }
        }

        if (text !== undefined) {
            const textEl = el.querySelector('.alert__text');
            if (textEl) textEl.innerHTML = text;
        }

        if (hidden !== undefined) {
            if (hidden) el.setAttribute('hidden', '');
            else el.removeAttribute('hidden');
        }
    }

    /**
     * Displays a warning alert on a specific screen.
     * @param {number} screenNum - Screen number identifier.
     * @param {string} msg - The message to display.
     */
    showWarning(screenNum, msg) {
        this.updateAlert(`warning-screen-${screenNum}`, {
            variant: 'warning',
            icon: 'icon-error.svg',
            text: msg,
            hidden: false
        });
    }

    /**
     * Hides a warning alert on a specific screen.
     * @param {number} screenNum - Screen number identifier.
     */
    hideWarning(screenNum) {
        this.updateAlert(`warning-screen-${screenNum}`, { hidden: true });
    }

    /**
     * Renders text summaries and card totals of the results to the results screen.
     * @param {Object} summary - Unified calculation summary.
     * @param {Object} state - Current application state (for regional context).
     */
    renderResultsSummary(summary, state) {
        const { monthly, upfront } = summary;
        
        // Update Monthly Summary Cards
        if (this.#elements.resultP1) this.#elements.resultP1.innerText = formatCurrency(monthly.p1, 2);
        if (this.#elements.resultP2) this.#elements.resultP2.innerText = formatCurrency(monthly.p2, 2);
        if (this.#elements.totalBillDisplay) this.#elements.totalBillDisplay.innerText = formatCurrency(monthly.total, 2);

        // Update Upfront Summary Cards
        if (this.#elements.equityP1Display) this.#elements.equityP1Display.innerText = formatCurrency(upfront.p1, 2);
        if (this.#elements.equityP2Display) this.#elements.equityP2Display.innerText = formatCurrency(upfront.p2, 2);

        // 1. Upfront Breakdown Table
        const upfrontRatio = state.depositSplitProportional ? state.ratioP1 : 0.5;
        const taxLabel = state.regionCode === 'SC' ? 'Stamp Duty (LBTT)' : (state.regionCode === 'WA' ? 'Stamp Duty (LTT)' : 'Stamp Duty (SDLT)');
        
        if (this.#elements.upfrontTaxLabel) this.#elements.upfrontTaxLabel.innerText = taxLabel;
        
        this.updateBreakdownRow('UpfrontDeposit', state.totalEquity, state.totalEquity * upfrontRatio, state.totalEquity * (1 - upfrontRatio));
        this.updateBreakdownRow('UpfrontTax', upfront.sdlt, upfront.sdlt * upfrontRatio, upfront.sdlt * (1 - upfrontRatio));
        this.updateBreakdownRow('UpfrontLegal', upfront.legalFees, upfront.legalFees * upfrontRatio, upfront.legalFees * (1 - upfrontRatio));
        this.updateBreakdownRow('UpfrontFees', state.mortgageFees || 0, (state.mortgageFees || 0) * upfrontRatio, (state.mortgageFees || 0) * (1 - upfrontRatio));
        this.updateBreakdownRow('UpfrontTotal', upfront.total, upfront.p1, upfront.p2);

        // 2. Monthly Breakdown Table
        const { costs } = monthly;
        this.updateBreakdownRow('Mortgage', costs.mortgage.total, costs.mortgage.p1, costs.mortgage.p2);
        this.updateBreakdownRow('Tax', costs.councilTax.total, costs.councilTax.p1, costs.councilTax.p2);
        this.updateBreakdownRow('Energy', costs.energy.total, costs.energy.p1, costs.energy.p2);
        this.updateBreakdownRow('Water', costs.water.total, costs.water.p1, costs.water.p2);
        this.updateBreakdownRow('Broadband', costs.broadband.total, costs.broadband.p1, costs.broadband.p2);
        this.updateBreakdownRow('Groceries', costs.groceries.total, costs.groceries.p1, costs.groceries.p2);
        this.updateBreakdownRow('Childcare', costs.childcare.total, costs.childcare.p1, costs.childcare.p2);
        this.updateBreakdownRow('Insurance', costs.insurance.total, costs.insurance.p1, costs.insurance.p2);
        this.updateBreakdownRow('Other', costs.otherShared.total, costs.otherShared.p1, costs.otherShared.p2);
        this.updateBreakdownRow('Total', monthly.total, monthly.p1, monthly.p2);

        const diff = Math.abs(monthly.p1 - monthly.p2);
        const summaryText = this.#elements.resultSummary?.querySelector('.alert__text');
        
        if (summaryText) {
            const moreP = monthly.p1 > monthly.p2 ? 'You' : 'Your Partner';
            const verb = moreP === 'You' ? 'pay' : 'pays';
            summaryText.innerText = diff < 0.01 ? "Both partners contribute equally." : `${moreP} ${verb} ${formatCurrency(diff, 2)} more per month.`;
            this.#elements.resultSummary.removeAttribute('hidden');
        }

        if (this.#elements.breakdownSummary) {
            const { costs: monthlyCosts } = monthly;
            const mainCosts = (monthlyCosts.mortgage.total + monthlyCosts.councilTax.total + monthlyCosts.energy.total + monthlyCosts.water.total).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const lifestyleCosts = (monthlyCosts.broadband.total + monthlyCosts.groceries.total + monthlyCosts.childcare.total + monthlyCosts.insurance.total + monthlyCosts.otherShared.total).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalMonthlySpend = monthly.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            this.#elements.breakdownSummary.innerText = `Out of the £${totalMonthlySpend} total monthly spend, £${mainCosts} is dedicated to the property and utilities, while £${lifestyleCosts} covers shared lifestyle and committed costs.`;
        }
    }

    /**
     * Renders detailed calculation workings to the hidden workings panel.
     * @param {Object} state - Current application state.
     */
    renderCalculationWorkings(state) {
        const wk = this.#elements;
        if (wk.wkSalaryP1) wk.wkSalaryP1.innerText = formatCurrency(state.salaryP1);
        if (wk.wkSalaryP2) wk.wkSalaryP2.innerText = formatCurrency(state.salaryP2);
        if (wk.wkTotalSalary) wk.wkTotalSalary.innerText = formatCurrency(state.salaryP1 + state.salaryP2);
        if (wk.wkP1Perc) wk.wkP1Perc.innerText = (state.ratioP1 * 100).toFixed(1) + '%';
        if (wk.wkP2Perc) wk.wkP2Perc.innerText = (state.ratioP2 * 100).toFixed(1) + '%';
        if (wk.wkPropertyPrice) wk.wkPropertyPrice.innerText = formatCurrency(state.propertyPrice);
        if (wk.wkDepositPerc) wk.wkDepositPerc.innerText = state.depositPercentage.toFixed(1) + '%';
        if (wk.wkTotalEquity) wk.wkTotalEquity.innerText = formatCurrency(state.totalEquity);
        if (wk.wkDepositSplitType) wk.wkDepositSplitType.innerText = state.depositSplitProportional ? 'Income Ratio' : '50/50';
        if (wk.wkMortgageRequired) wk.wkMortgageRequired.innerText = formatCurrency(state.mortgageRequired);
        if (wk.wkInterestRate) wk.wkInterestRate.innerText = state.mortgageInterestRate + '%';
        if (wk.wkMortgageTerm) wk.wkMortgageTerm.innerText = state.mortgageTerm;
        if (wk.wkMonthlyPayment) wk.wkMonthlyPayment.innerText = formatCurrency(state.monthlyMortgagePayment, 2);
        if (wk.wkTotalRepayment) wk.wkTotalRepayment.innerText = formatCurrency(state.totalRepayment, 2);
    }

    /**
     * Initializes custom select components for all select elements in the DOM.
     */
    initCustomSelects() {
        document.querySelectorAll('select').forEach(select => {
            if (!this.#customSelects.has(select)) {
                this.#customSelects.set(select, new CustomSelect(select));
            }
        });
    }

    /**
     * Refreshes all custom select components to match their native counterparts.
     */
    refreshCustomSelects() {
        this.#customSelects.forEach(cs => cs.refresh());
    }

    /**
     * Full UI refresh based on application state.
     * @param {Object} state - The current application state.
     */
    render(state) {
        this.updatePieChart(state.ratioP1, state.ratioP2);

        // Update calculated equity fields if they exist
        if (state.monthlyMortgagePayment !== undefined && this.#elements.monthlyMortgageDisplay) {
            this.#elements.monthlyMortgageDisplay.value = formatNumber(state.monthlyMortgagePayment, 0);
        }
        if (state.totalRepayment !== undefined && this.#elements.totalRepaymentDisplay) {
            this.#elements.totalRepaymentDisplay.value = formatNumber(state.totalRepayment, 0);
        }

        // Sync deposit percentage/amount if provided in state
        if (state.depositPercentage !== undefined && this.#elements.depositPercentage) {
            this.#elements.depositPercentage.value = state.depositPercentage.toFixed(1);
        }
        if (state.depositAmount !== undefined && this.#elements.depositAmount) {
            this.#elements.depositAmount.value = state.depositAmount;
        }
    }
}
