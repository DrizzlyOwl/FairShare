/**
 * UrlService.js
 * Handles serialization and deserialization of state to/from the URL hash.
 */

/* global btoa, atob */

import Logger from '../utils/Logger.js';

export default class UrlService extends Logger {
    constructor() {
        super('UrlService');
    }

    /**
     * Serializes a state object into a Base64 string.
     * Filters out internal/transient fields starting with '_'.
     * @param {Object} state - The application state.
     * @returns {string} Base64 encoded state.
     */
    serialize(state) {
        try {
            // Filter out transient UI-only fields
            const filteredState = Object.keys(state).reduce((acc, key) => {
                if (!key.startsWith('_')) {
                    acc[key] = state[key];
                }
                return acc;
            }, {});

            const json = JSON.stringify(filteredState);
            // Use btoa with URI encoding to handle special characters
            return btoa(encodeURIComponent(json));
        } catch (e) {
            this.error('Failed to serialize state:', e);
            return '';
        }
    }

    /**
     * Deserializes a Base64 string back into a state object.
     * @param {string} base64 - The encoded string from the URL.
     * @returns {Object|null} The parsed state or null if invalid.
     */
    deserialize(base64) {
        if (!base64) return null;
        try {
            const json = decodeURIComponent(atob(base64));
            return JSON.parse(json);
        } catch (_e) {
            this.warn('Failed to deserialize URL state. It may be corrupted or an old version.');
            return null;
        }
    }

    /**
     * Updates the browser URL hash with the serialized state.
     * Uses replaceState to avoid cluttering browser history.
     * @param {Object} state - Current application state.
     */
    updateUrl(state) {
        const serialized = this.serialize(state);
        if (serialized) {
            const newUrl = new URL(window.location.href);
            newUrl.hash = `state=${serialized}`;
            window.history.replaceState(null, '', newUrl.href);
        }
    }

    /**
     * Extracts state data from the current URL hash if present.
     * @returns {Object|null}
     */
    getStateFromUrl() {
        const hash = window.location.hash;
        if (hash.startsWith('#state=')) {
            return this.deserialize(hash.substring(7));
        }
        return null;
    }
}
