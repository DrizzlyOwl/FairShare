describe('FairShare - State Persistence', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.enablePersistence();
  });

  it('persists data across page reloads', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    
    // Step 1 -> Step 2
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="screen-2"]').should('exist');

    // Fill Step 2 (Income)
    cy.get('[data-cy="salaryP1-input"]').clear({ force: true }).type('75000', { force: true }).blur({ force: true });
    cy.get('[data-cy="salaryP2-input"]').clear({ force: true }).type('25000', { force: true }).blur({ force: true });
    
    // Reload
    cy.reload();
    cy.disableAnimations();
    cy.waitForAppReady();

    // Verify we are still on Step 2 and values are preserved
    cy.get('[data-cy="screen-2"]').should('exist');
    cy.get('[data-cy="salaryP1-input"]').should('have.value', '75000');
    cy.get('[data-cy="salaryP2-input"]').should('have.value', '25000');

    // Proceed to Step 3 (Property)
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="screen-3"]', { timeout: 10000 }).should('exist');

    cy.get('[data-cy="postcode-input"]').clear({ force: true }).type('SW1A 1AA', { force: true }).blur({ force: true });
    cy.get('[data-cy="propertyPrice-input"]').clear({ force: true }).type('450000', { force: true }).blur({ force: true });

    // Reload again
    cy.reload();
    cy.disableAnimations();
    cy.waitForAppReady();

    // Verify Step 3 and values
    cy.get('[data-cy="screen-3"]').should('exist');
    cy.get('[data-cy="postcode-input"]').should('have.value', 'SW1A 1AA');
    cy.get('[data-cy="propertyPrice-input"]').should('have.value', '450000');
    });

    it('restores state from a deep link with localStorage', () => {
      // Manually set localStorage before visiting
      const state = {
          version: 1,
          salaryP1: 50000,
          salaryP2: 50000,
          salaryType: 'gross',
          postcode: 'EH1 1YZ',
          propertyPrice: 250000,
          taxBand: 'B'
      };

      // Visit a specific screen via hash and set localStorage onBeforeLoad
      cy.visit('index.html', {
          onBeforeLoad: (win) => {
              win.localStorage.setItem('fairshare_cache', JSON.stringify(state));
          }
      });
      cy.disableAnimations();
      cy.waitForAppReady();

      // Trigger hash change after app is ready
      cy.window().then((win) => {
          win.location.hash = 'screen-3';
      });

      // Use a longer timeout and check attribute instead of visibility
      cy.get('[data-cy="screen-3"]', { timeout: 10000 }).should('not.have.attr', 'hidden');
      cy.get('[data-cy="postcode-input"]').should('have.value', 'EH1 1YZ');

      cy.get('[data-cy="propertyPrice-input"]').should('have.value', '250000');
    });

  it('clears persistence when clicking Start Over', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    
    cy.skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('88888').blur();
    
    cy.get('[data-cy="start-over-button"]').click({ force: true });
    cy.get('[data-cy="screen-1"]').should('be.visible');

    // Reload to ensure it's really gone from localStorage
    cy.reload();
    cy.disableAnimations();
    cy.waitForAppReady();
    
    cy.skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').should('have.value', '0');
  });
});
