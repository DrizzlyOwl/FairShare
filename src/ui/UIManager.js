/**
 * UIManager.js
 * Manages the application's view state, screen transitions, and DOM updates.
 */

import { createAlertHTML, formatCurrency } from './Components.js';

export default class UIManager {
    SCREENS = {
        LANDING: 'screen-1',
        INCOME: 'screen-2',
        PROPERTY: 'screen-3',
        MORTGAGE: 'screen-4',
        UTILITIES: 'screen-5',
        COMMITTED: 'screen-6',
        RESULTS: 'screen-7'
    };

    /**
     * @param {Object} elements - Pre-populated element cache.
     * @param {Object} bandPrices - Regional cost reference.
     */
    constructor(elements, bandPrices) {
        this.elements = elements;
        this.bandPrices = bandPrices;
    }

    /**
     * Transitions to a new screen.
     */
    switchScreen(id, isInitialLoad = false) {
        const target = document.getElementById(id);
        const heading = target.querySelector('h2');

        if (!isInitialLoad) {
            window.location.hash = heading?.id || id;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        document.querySelectorAll('main section').forEach(el => el.setAttribute('hidden', ''));
        target.removeAttribute('hidden');
        
        if (!isInitialLoad) target.focus();

        this.updateProgress(id);
        this.updateLogoVisibility(id);
        
        // Notify orchestrator to update navigation buttons
        if (window.app && window.app.updatePagination) {
            window.app.updatePagination(id);
        }
    }

    /**
     * Updates progress bar and text label.
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
     * Updates the visual ratio bar.
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
     * Renders a breakdown row in the results table.
     */
    updateBreakdownRow(key, total, p1, p2) {
        if (this.elements[`bd${key}Total`]) this.elements[`bd${key}Total`].innerText = formatCurrency(total, 2);
        if (this.elements[`bd${key}P1`]) this.elements[`bd${key}P1`].innerText = formatCurrency(p1, 2);
        if (this.elements[`bd${key}P2`]) this.elements[`bd${key}P2`].innerText = formatCurrency(p2, 2);
    }

    /**
     * Displays a warning alert on a specific screen.
     */
    showWarning(screenNum, msg) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (!warnDiv) return;
        warnDiv.outerHTML = createAlertHTML('warning', 'icon-error.svg', msg, `warning-screen-${screenNum}`);
    }

    hideWarning(screenNum) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (warnDiv) warnDiv.setAttribute('hidden', '');
    }

    /**
     * Full UI refresh based on application state.
     */
    render(state) {
        this.updateRatioBar(state.ratioP1, state.ratioP2);
        // Additional selective render logic can be added here
    }
}
