/**
 * UIManager.js
 * Manages the application's view state, screen transitions, and DOM updates.
 */

import { createAlertHTML, formatCurrency } from './Components.js';
import { SCREEN_MAP } from '../core/Constants.js';

export default class UIManager {
    SCREENS = SCREEN_MAP;

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
     * @param {string} id - The ID of the screen to switch to.
     * @param {boolean} [isInitialLoad=false] - Whether this is the first screen load.
     */
    switchScreen(id, isInitialLoad = false) {
        console.log(`UIManager switching to screen: ${id}`);
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
        
        // Notify orchestrator to update navigation buttons
        if (window.app && window.app.updatePagination) {
            window.app.updatePagination(id);
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
        const display = this.elements.bandPriceDisplay;
        if (display) {
            display.outerHTML = createAlertHTML('info', 'icon-info.svg', `Band ${band} selected. Estimated cost: ${formatCurrency(cost)} per month.`, 'band-price-display');
            // Re-cache element after outerHTML replacement
            this.elements.bandPriceDisplay = document.getElementById('band-price-display');
        }
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
     * Displays a warning alert on a specific screen.
     * @param {number} screenNum - Screen number identifier.
     * @param {string} msg - The message to display.
     */
    showWarning(screenNum, msg) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (!warnDiv) return;
        warnDiv.outerHTML = createAlertHTML('warning', 'icon-error.svg', msg, `warning-screen-${screenNum}`, false);
    }

    /**
     * Hides a warning alert on a specific screen.
     * @param {number} screenNum - Screen number identifier.
     */
    hideWarning(screenNum) {
        const warnDiv = document.getElementById(`warning-screen-${screenNum}`);
        if (warnDiv) warnDiv.setAttribute('hidden', '');
    }

    /**
     * Full UI refresh based on application state.
     * @param {Object} state - The current application state.
     */
    render(state) {
        this.updateRatioBar(state.ratioP1, state.ratioP2);
        // Additional selective render logic can be added here
    }
}
