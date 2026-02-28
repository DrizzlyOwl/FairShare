/**
 * ThemeManager.js
 * Handles application-wide theme state, persistence, and asset switching.
 */

export default class ThemeManager {
    /**
     * @param {Object} elements - Pre-populated element cache.
     * @param {string} [storageKey='fairshare_theme'] - LocalStorage key for theme.
     */
    constructor(elements, storageKey = 'fairshare_theme') {
        this.elements = elements;
        this.storageKey = storageKey;
        this.theme = localStorage.getItem(this.storageKey) || 'light';
    }

    /**
     * Initializes the theme based on cached preferences.
     */
    init() {
        this.applyTheme(this.theme);
    }

    /**
     * Toggles between 'light' and 'dark' themes.
     */
    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.theme);
        localStorage.setItem(this.storageKey, this.theme);
    }

    /**
     * Applies the theme attribute and updates relevant visual assets.
     * @param {string} theme - The theme to apply.
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const logoImg = this.elements.headerBrand?.querySelector('.header-brand__icon');
        if (logoImg) {
            const buster = logoImg.src.match(/\?v=\d+/) || '';
            const logoBase = theme === 'dark' ? 'logo-icon-dark.svg' : 'logo-icon.svg';
            logoImg.src = `${logoBase}${buster}`;
        }
    }

    /**
     * Gets the current theme.
     * @returns {string}
     */
    getTheme() {
        return this.theme;
    }
}
