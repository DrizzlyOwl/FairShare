/**
 * Components.js
 * Single source of truth for programmatically generated UI components.
 */

/**
 * Programmatically generates an alert component HTML string.
 * @param {string} variant - 'info', 'warning', or 'error'.
 * @param {string} iconName - Icon name slug (e.g. 'info' for icon--info).
 * @param {string} text - Message text.
 * @param {string} [id=''] - Optional element ID.
 * @param {boolean} [hidden=false] - Whether to start hidden.
 * @returns {string} HTML string for the component.
 */
export const createAlertHTML = (variant, iconName, text, id = '', hidden = false) => {
    const idAttr = id ? `id="${id}"` : '';
    const hiddenAttr = hidden ? 'hidden' : '';
    // Strip 'icon-' prefix and '.svg' suffix if provided to get the base name
    const iconSlug = iconName.replace('icon-', '').replace('.svg', '');
    
    return `
        <div ${idAttr} class="alert alert--${variant}" ${hiddenAttr}>
            <span class="alert__icon alert__icon--${variant} icon--${iconSlug}" aria-hidden="true"></span>
            <div class="alert__text">${text}</div>
        </div>
    `;
};
