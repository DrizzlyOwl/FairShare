/**
 * Components.js
 * Single source of truth for programmatically generated UI components.
 */

/**
 * Programmatically generates an alert component HTML string.
 * @param {string} variant - 'info', 'warning', or 'error'.
 * @param {string} iconName - SVG filename in /icons.
 * @param {string} text - Message text.
 * @param {string} [id=''] - Optional element ID.
 * @param {boolean} [hidden=false] - Whether to start hidden.
 * @returns {string} HTML string for the component.
 */
export const createAlertHTML = (variant, iconName, text, id = '', hidden = false) => {
    const idAttr = id ? `id="${id}"` : '';
    const hiddenAttr = hidden ? 'hidden' : '';
    return `
        <div ${idAttr} class="alert alert--${variant}" ${hiddenAttr}>
            <span class="alert__icon" style="-webkit-mask-image: url('icons/${iconName}'); mask-image: url('icons/${iconName}');" aria-hidden="true"></span>
            <div class="alert__text">${text}</div>
        </div>
    `;
};
