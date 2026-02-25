/**
 * Components.js
 * Programmatic HTML generation and formatting utilities.
 */

const currencyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

const currencyFormatterDecimals = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

/**
 * Formats a number as GBP currency.
 */
export const formatCurrency = (num, decimals = 0) => {
    return decimals === 0 ? currencyFormatter.format(num) : currencyFormatterDecimals.format(num);
};

/**
 * Programmatically generates an alert component.
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
