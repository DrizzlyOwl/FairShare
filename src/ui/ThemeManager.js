/**
 * ThemeManager.js
 * Handles application-wide theme state, persistence, and asset switching.
 */

export default class ThemeManager {
    #elements;
    #storageKey;
    #theme;

    /**
     * @param {Object} elements - Pre-populated element cache.
     * @param {string} [storageKey='fairshare_theme'] - LocalStorage key for theme.
     */
    constructor(elements, storageKey = 'fairshare_theme') {
        this.#elements = elements;
        this.#storageKey = storageKey;
        this.#theme = localStorage.getItem(this.#storageKey) || 'light';
    }

    /**
     * Initializes the theme based on cached preferences.
     */
    init() {
        this.applyTheme(this.#theme);
    }

    /**
     * Toggles between 'light' and 'dark' themes.
     */
    toggle() {
        this.#theme = this.#theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.#theme);
        localStorage.setItem(this.#storageKey, this.#theme);
    }

    /**
     * Applies the theme attribute and updates relevant visual assets.
     * @param {string} theme - The theme to apply.
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // 1. Update Header Logo
        const logoImg = this.#elements.headerBrand?.querySelector('.header-brand__icon');
        if (logoImg) {
            const buster = logoImg.src.match(/\?v=\d+/) || '';
            const logoBase = theme === 'dark' ? 'logo-icon-dark.svg' : 'logo-icon.svg';
            logoImg.src = `${logoBase}${buster}`;
        }

        // 2. Update Theme Toggle Icon & ARIA
        const themeBtn = this.#elements.themeToggle;
        if (themeBtn) {
            const icon = themeBtn.querySelector('.icon-btn');
            if (icon) {
                icon.classList.remove('icon--sun', 'icon--moon');
                icon.classList.add(theme === 'dark' ? 'icon--sun' : 'icon--moon');
            }
            themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    /**
     * Gets the current theme.
     * @returns {string}
     */
    getTheme() {
        return this.#theme;
    }
}
