/**
 * Logger.js
 * Standardized logging utility with tagging and level control.
 */

import { DEBUG } from '../core/Constants.js';

export default class Logger {
    #tag;

    /**
     * @param {string} tag - The name of the module/component using the logger.
     */
    constructor(tag) {
        this.#tag = tag;
    }

    /**
     * Internal formatting for log messages.
     * @param {string} level - Log level (DEBUG, INFO, etc).
     * @param {string} message - The message to log.
     * @returns {string} Formatted string.
     */
    #format(level, message) {
        return `[${level}] [${this.#tag}] ${message}`;
    }

    /**
     * Writes a debug message to the console if DEBUG mode is enabled.
     * @param {string} message 
     * @param  {...any} args 
     */
    debug(message, ...args) {
        const isDebug = (typeof window !== 'undefined' && typeof window.DEBUG !== 'undefined') 
            ? window.DEBUG 
            : DEBUG;

        if (isDebug) {
            console.debug(this.#format('DEBUG', message), ...args);
        }
    }

    /**
     * Writes an informational message to the console.
     * @param {string} message 
     * @param  {...any} args 
     */
    info(message, ...args) {
        console.info(this.#format('INFO', message), ...args);
    }

    /**
     * Writes a warning message to the console.
     * @param {string} message 
     * @param  {...any} args 
     */
    warn(message, ...args) {
        console.warn(this.#format('WARN', message), ...args);
    }

    /**
     * Writes an error message to the console.
     * @param {string} message 
     * @param  {...any} args 
     */
    error(message, ...args) {
        console.error(this.#format('ERROR', message), ...args);
    }
}
