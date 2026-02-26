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
    }

    /**
     * Handles browser back/forward buttons via hash changes.
     */
    handlePopState() {
        const initialScreen = window.location.hash.replace('#', '') || this.ui.SCREENS.LANDING;
        const targetId = this.findScreenByHeadingId(initialScreen) || this.ui.SCREENS.LANDING;
        this.ui.switchScreen(targetId, true);
    }

    /**
     * Attempts to resolve a screen ID from a section heading ID.
     * @param {string} id - Hash fragment or heading ID.
     * @returns {string|undefined} Section ID.
     */
    findScreenByHeadingId(id) {
        const heading = document.getElementById(id);
        return heading?.closest('section')?.id;
    }

    /**
     * Intercepts global keyboard events for accessibility navigation.
     * @param {KeyboardEvent} e 
     */
    handleGlobalKeydown(e) {
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isInput) return;
        
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            this.elements.nextButton?.click();
        } else if (e.key === 'ArrowLeft') {
            this.elements.backButton?.click();
        }
    }

    /**
     * Updates navigation button configuration for the current screen.
     * @param {string} screenId - Active screen identifier.
     */
    updatePagination(screenId) {
        const back = this.elements.backButton;
        const next = this.elements.nextButton;
        if (!back || !next) return;

        const config = {
            [this.ui.SCREENS.LANDING]: { back: null, next: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), text: 'Get Started' },
            [this.ui.SCREENS.INCOME]: { back: () => this.ui.switchScreen(this.ui.SCREENS.LANDING), next: () => this.app.validateAndNext(this.ui.SCREENS.INCOME) },
            [this.ui.SCREENS.PROPERTY]: { back: () => this.ui.switchScreen(this.ui.SCREENS.INCOME), next: () => this.app.validateAndNext(this.ui.SCREENS.PROPERTY) },
            [this.ui.SCREENS.MORTGAGE]: { back: () => this.ui.switchScreen(this.ui.SCREENS.PROPERTY), next: () => this.app.validateAndNext(this.ui.SCREENS.MORTGAGE) },
            [this.ui.SCREENS.UTILITIES]: { back: () => this.ui.switchScreen(this.ui.SCREENS.MORTGAGE), next: () => this.app.validateAndNext(this.ui.SCREENS.UTILITIES) },
            [this.ui.SCREENS.COMMITTED]: { back: () => this.ui.switchScreen(this.ui.SCREENS.UTILITIES), next: () => this.app.validateAndNext(this.ui.SCREENS.COMMITTED), text: 'Calculate' },
            [this.ui.SCREENS.RESULTS]: { back: () => this.ui.switchScreen(this.ui.SCREENS.COMMITTED), next: () => this.app.clearCache(), text: 'Start Over' }
        };

        const screen = config[screenId];
        if (screen.back) {
            back.onclick = screen.back;
            back.removeAttribute('hidden');
        } else {
            back.setAttribute('hidden', '');
        }

        next.onclick = screen.next;
        next.innerText = screen.text || 'Next';
    }
}
