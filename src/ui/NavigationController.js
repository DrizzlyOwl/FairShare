/**
 * NavigationController.js
 * Manages the screen-to-screen lifecycle, history/hash routing, and pagination logic.
 */

export default class NavigationController {
    /**
     * @param {Object} app - Reference to the main app orchestrator.
     * @param {UIManager} ui - Reference to the UI manager.
     * @param {Object} elements - Pre-populated element cache.
     */
    constructor(app, ui, elements) {
        this.app = app;
        this.ui = ui;
        this.elements = elements;
        
        // Bind event listeners
        this.bindEvents();
    }

    /**
     * Binds global keyboard and window events for navigation.
     */
    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
        window.addEventListener('popstate', () => this.handlePopState());

        const main = document.querySelector('main');
        if (main) {
            main.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                if (target.id === 'back-button') {
                    const screenId = this.getActiveScreenId();
                    const config = this.getNavConfig(screenId);
                    if (config?.back) config.back();
                } else if (target.id === 'next-button') {
                    const screenId = this.getActiveScreenId();
                    const config = this.getNavConfig(screenId);
                    if (config?.next) config.next();
                }
            });
        }
    }

    /**
     * Helper to get current active screen ID.
     */
    getActiveScreenId() {
        return document.querySelector('section.screen:not([hidden])')?.id;
    }

    /**
     * Returns navigation configuration for all screens.
     */
    getNavConfig(screenId) {
        return {
            [this.ui.SCREENS.LANDING]: { back: null, next: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), text: 'Get Started' },
            [this.ui.SCREENS.INCOME]: { back: () => this.ui.switchScreen(this.ui.SCREENS.LANDING), next: () => this.app.validateAndNext(this.ui.SCREENS.INCOME) },
            [this.ui.SCREENS.PROPERTY]: { back: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), next: () => this.app.validateAndNext(this.ui.SCREENS.PROPERTY) },
            [this.ui.SCREENS.MORTGAGE]: { back: () => this.ui.switchScreen(this.ui.SCREENS.PROPERTY), next: () => this.app.validateAndNext(this.ui.SCREENS.MORTGAGE) },
            [this.ui.SCREENS.UTILITIES]: { back: () => this.ui.switchScreen(this.ui.SCREENS.MORTGAGE), next: () => this.app.validateAndNext(this.ui.SCREENS.UTILITIES) },
            [this.ui.SCREENS.COMMITTED]: { back: () => this.ui.switchScreen(this.ui.SCREENS.UTILITIES), next: () => this.app.validateAndNext(this.ui.SCREENS.COMMITTED), text: 'Calculate' },
            [this.ui.SCREENS.RESULTS]: { back: () => this.ui.switchScreen(this.ui.SCREENS.COMMITTED), next: () => this.app.clearCache(), text: 'Start Over' }
        }[screenId];
    }

    /**
     * Updates navigation button configuration for the current screen.
     * @param {string} screenId - Active screen identifier.
     */
    updatePagination(screenId) {
        const back = this.elements.backButton;
        const next = this.elements.nextButton;
        if (!back || !next) return;

        const screen = this.getNavConfig(screenId);
        if (screen.back) {
            back.removeAttribute('hidden');
        } else {
            back.setAttribute('hidden', '');
        }

        next.innerText = screen.text || 'Next';
    }
}
