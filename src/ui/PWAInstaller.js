/**
 * PWAInstaller.js
 * Handles the custom PWA installation prompt logic.
 * Follows guidelines from https://web.dev/learn/pwa/installation-prompt
 */

export default class PWAInstaller {
    #installButton;
    #deferredPrompt = null;

    /**
     * @param {HTMLElement} installButton - The button that triggers the installation.
     */
    constructor(installButton) {
        this.#installButton = installButton;
        this.#init();
    }

    /**
     * Initializes listeners for PWA installation events.
     */
    #init() {
        if (!this.#installButton) return;

        // Hide button by default
        this.#installButton.setAttribute('hidden', '');

        window.addEventListener('beforeinstallprompt', (e) => {
            // 1. Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // 2. Stash the event so it can be triggered later.
            this.#deferredPrompt = e;
            // 3. Update UI notify the user they can install the PWA
            this.#showInstallPromotion();
            
            console.log('[PWA] beforeinstallprompt event captured');
        });

        this.#installButton.addEventListener('click', async () => {
            if (!this.#deferredPrompt) return;

            // 4. Show the install prompt
            this.#deferredPrompt.prompt();

            // 5. Wait for the user to respond to the prompt
            const { outcome } = await this.#deferredPrompt.userChoice;
            console.log(`[PWA] User response to the install prompt: ${outcome}`);

            // 6. We've used the prompt, and can't use it again, throw it away
            this.#deferredPrompt = null;

            // 7. Hide the install button
            this.#hideInstallPromotion();
        });

        window.addEventListener('appinstalled', (event) => {
            // 8. Log the installation
            console.log('[PWA] App was installed');
            // 9. Hide the install button
            this.#hideInstallPromotion();
            // 10. Clear the deferred prompt
            this.#deferredPrompt = null;
        });
    }

    #showInstallPromotion() {
        this.#installButton.removeAttribute('hidden');
    }

    #hideInstallPromotion() {
        this.#installButton.setAttribute('hidden', '');
    }
}
