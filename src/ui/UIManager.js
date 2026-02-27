/**
 * UIManager.js
 * Manages the application's view state, screen transitions, and DOM updates.
 */

import { createAlertHTML, formatCurrency } from '../utils/Helpers.js';
import { SCREEN_MAP } from '../core/Constants.js';

export default class UIManager {
    SCREENS = SCREEN_MAP;

    /**
     * @param {Object} elements - Pre-populated element cache.
     * @param {Object} bandPrices - Regional cost reference.
     * @param {Function} onScreenChangeCallback - Called when screen transitions occur.
     */
    constructor(elements, bandPrices, onScreenChangeCallback = null) {
        this.elements = elements;
        this.bandPrices = bandPrices;
        this.onScreenChange = onScreenChangeCallback;
    }

    /**
     * Transitions to a new screen.
     * @param {string} id - The ID of the screen to switch to.
     * @param {boolean} [isInitialLoad=false] - Whether this is the first screen load.
     */
    switchScreen(id, isInitialLoad = false) {
        console.log(`[UIManager] Navigating to: ${id} (Initial Load: ${isInitialLoad})`);
        const target = document.getElementById(id);
        if (!target) {
            console.error(`Target screen not found: ${id}`);
            return;
        }

        const heading = target.querySelector('h2');

        // Only update hash if not initial load and not in a test environment
        // Hash updates can trigger unwanted page cycles in some CI/Test runners
        if (!isInitialLoad && !window.Cypress) {
            window.location.hash = heading?.id || id;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Hide all screens
        document.querySelectorAll('main section.screen').forEach(el => {
            el.setAttribute('hidden', '');
        });
        
        // Show target
        target.removeAttribute('hidden');
        console.log(`Screen ${id} hidden attribute after removal: ${target.hasAttribute('hidden')}`);
        
        if (!isInitialLoad) target.focus();

        this.updateProgress(id);
        this.updateLogoVisibility(id);
        this.updateBackgroundImage(id);
        
        // Notify via callback instead of global object
        if (this.onScreenChange) {
            this.onScreenChange(id);
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
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${stepData.p}%`;
            this.elements.progressBar.setAttribute('aria-valuenow', stepData.p);
            this.elements.progressBar.setAttribute('aria-valuetext', stepData.text);
        }
        if (this.elements.progressLabel) {
            this.elements.progressLabel.innerText = stepData.text;
        }
    }

    /**
     * Toggles visibility of the brand logo based on the screen.
     * @param {string} id - Current screen ID.
     */
    updateLogoVisibility(id) {
        const logo = this.elements.headerBrand?.querySelector('.header-brand__logo');
        if (!logo) return;
        
        if (id === this.SCREENS.LANDING) {
            logo.removeAttribute('hidden');
            this.elements.headerBrand.style.marginBottom = '2rem';
        } else {
            logo.setAttribute('hidden', '');
            this.elements.headerBrand.style.marginBottom = '3rem';
        }
    }

    /**
     * Updates the body background image based on the active screen.
     * @param {string} screenId - The active screen ID.
     */
    updateBackgroundImage(screenId) {
        const screenToImageMap = {
            [this.SCREENS.LANDING]: 'bg-landing.svg',
            [this.SCREENS.INCOME]: 'bg-income.svg',
            [this.SCREENS.PROPERTY]: 'bg-property.svg',
            [this.SCREENS.MORTGAGE]: 'bg-mortgage.svg',
            [this.SCREENS.UTILITIES]: 'bg-utilities.svg',
            [this.SCREENS.COMMITTED]: 'bg-committed.svg',
            [this.SCREENS.RESULTS]: 'bg-results.svg'
        };

        const newImage = screenToImageMap[screenId];
        if (newImage) {
            document.body.style.setProperty('--bg-image', `url('images/${newImage}')`);
        }
    }

    /**
     * Updates the visual ratio bar.
     * @param {number} ratioP1 - Partner 1 share (0-1).
     * @param {number} ratioP2 - Partner 2 share (0-1).
     */
    updateRatioBar(ratioP1, ratioP2) {
        const p1P = Math.round(ratioP1 * 100);
        const p2P = Math.round(ratioP2 * 100);
        if (this.elements.barP1) {
            this.elements.barP1.style.width = p1P + '%';
            this.elements.barP1.innerText = p1P + '%';
        }
        if (this.elements.barP2) {
            this.elements.barP2.style.width = p2P + '%';
            this.elements.barP2.innerText = p2P + '%';
        }
        if (this.elements.ratioTextDesc) {
            this.elements.ratioTextDesc.innerText = `Income ratio is ${p1P}% You and ${p2P}% Your Partner.`;
        }
    }

    /**
     * Updates the Council Tax cost preview based on selected band.
     * @param {string} band - The tax band letter (A-H).
     */
    updatePricePreview(band) {
        const cost = this.bandPrices[band];
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
        if (this.elements[`bd${key}Total`]) this.elements[`bd${key}Total`].innerText = formatCurrency(total, 2);
        if (this.elements[`bd${key}P1`]) this.elements[`bd${key}P1`].innerText = formatCurrency(p1, 2);
        if (this.elements[`bd${key}P2`]) this.elements[`bd${key}P2`].innerText = formatCurrency(p2, 2);
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
        }

        if (icon) {
            const iconEl = el.querySelector('.alert__icon');
            if (iconEl) {
                const url = `url('icons/${icon}')`;
                iconEl.style.webkitMaskImage = url;
                iconEl.style.maskImage = url;
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
     */
    renderResultsSummary(summary) {
        const { monthly, upfront } = summary;
        
        // Update Monthly Summary Cards
        if (this.elements.resultP1) this.elements.resultP1.innerText = formatCurrency(monthly.p1, 2);
        if (this.elements.resultP2) this.elements.resultP2.innerText = formatCurrency(monthly.p2, 2);
        if (this.elements.totalBillDisplay) this.elements.totalBillDisplay.innerText = formatCurrency(monthly.total, 2);

        // Update Upfront Summary Cards
        if (this.elements.equityP1Display) this.elements.equityP1Display.innerText = formatCurrency(upfront.p1, 2);
        if (this.elements.equityP2Display) this.elements.equityP2Display.innerText = formatCurrency(upfront.p2, 2);

        const diff = Math.abs(monthly.p1 - monthly.p2);
        const summaryText = this.elements.resultSummary?.querySelector('.alert__text');
        
        if (summaryText) {
            const moreP = monthly.p1 > monthly.p2 ? 'You' : 'Your Partner';
            const verb = moreP === 'You' ? 'pay' : 'pays';
            summaryText.innerText = diff < 0.01 ? "Both partners contribute equally." : `${moreP} ${verb} ${formatCurrency(diff, 2)} more per month.`;
            this.elements.resultSummary.removeAttribute('hidden');
        }

        if (this.elements.breakdownSummary) {
            const { costs } = monthly;
            const mainCosts = costs.mortgage.total + costs.councilTax.total + costs.energy.total + costs.water.total;
            const lifestyleCosts = costs.broadband.total + costs.groceries.total + costs.childcare.total + costs.insurance.total + costs.otherShared.total;
            
            this.elements.breakdownSummary.innerText = `Out of the £${monthly.total.toLocaleString('en-GB', {minimumFractionDigits: 2})} total monthly spend, £${mainCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} is dedicated to the property and utilities, while £${lifestyleCosts.toLocaleString('en-GB', {minimumFractionDigits: 2})} covers shared lifestyle and committed costs.`;
        }
    }

    /**
     * Renders detailed calculation workings to the hidden workings panel.
     * @param {Object} state - Current application state.
     */
    renderCalculationWorkings(state) {
        const wk = this.elements;
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
     * Full UI refresh based on application state.
     * @param {Object} state - The current application state.
     */
    render(state) {
        this.updateRatioBar(state.ratioP1, state.ratioP2);
    }
}
