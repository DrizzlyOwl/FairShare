describe('FairShare - PWA & Offline Support', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    // Do NOT stub service worker here as we want to test PWA features
  });

  it('shows the offline indicator when the network is lost', () => {
    cy.visit('index.html', {
      onBeforeLoad(win) {
        // Stub navigator.onLine to return true initially
        cy.stub(win.navigator, 'onLine').get(() => true);
      }
    });
    cy.disableAnimations();
    cy.waitForAppReady();

    // Verify indicator is hidden initially
    cy.get('[data-ui="offlineIndicator"]').should('not.be.visible');

    // Simulate going offline
    cy.window().then((win) => {
      // Update the stub to return false
      cy.stub(win.navigator, 'onLine').get(() => false);
      // Dispatch the event
      win.dispatchEvent(new win.Event('offline'));
    });

    // Verify indicator is shown
    cy.get('[data-ui="offlineIndicator"]').should('be.visible').and('contain.text', 'Working Offline');

    // Simulate going back online
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').get(() => true);
      win.dispatchEvent(new win.Event('online'));
    });

    // Verify indicator is hidden again
    cy.get('[data-ui="offlineIndicator"]').should('not.be.visible');
  });

  it('maintains application functionality while offline', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();

    // Go to Step 2
    cy.skipToStep2();

    // Simulate offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').get(() => false);
      win.dispatchEvent(new win.Event('offline'));
    });

    // Interact with form (using force: true because the offline indicator might cover elements)
    cy.get('[data-cy="salaryP1-input"]').clear({ force: true }).type('50000', { force: true }).blur({ force: true });
    cy.get('[data-cy="salaryP2-input"]').clear({ force: true }).type('30000', { force: true }).blur({ force: true });
    cy.get('[data-cy="next-button"]').click({ force: true });
    
    // Verify we reached Step 3
    cy.get('[data-cy="screen-3"]').should('be.visible');
    
    // Verify data is still there
    cy.get('[data-cy="back-button"]').click();
    cy.get('[data-cy="salaryP1-input"]').should('have.value', '50000');
  });

  it('contains a valid manifest link', () => {
    cy.visit('index.html');
    cy.get('link[rel="manifest"]').should('have.attr', 'href', 'manifest.json');
  });
});
