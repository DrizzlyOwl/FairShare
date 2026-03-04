describe('FairShare - UI Preferences & Logic Cascading', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    // Enable persistence for theme tests
    cy.enablePersistence();
  });

  it('cascades master toggle selection to all sub-items on Utilities screen', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    
    cy.skipToStep2();
    cy.fillIncomeStep('50000', '50000');
    cy.fillPropertyStep('SW1A 1AA', '300000', 'C');
    cy.fillMortgageStep();

    cy.get('[data-cy="screen-5"]').should('exist');

    // Default should be "Income Ratio" (yes)
    cy.get('[data-cy="councilTaxSplitType-yes"]').should('be.checked');
    cy.get('[data-cy="energySplitType-yes"]').should('be.checked');

    // Click "Split All Equally" master toggle
    cy.get('[data-cy="masterUtilities-no"]').check({ force: true });

    // Verify all sub-items updated
    cy.get('[data-cy="councilTaxSplitType-no"]').should('be.checked');
    cy.get('[data-cy="energySplitType-no"]').should('be.checked');
    cy.get('[data-cy="waterSplitType-no"]').should('be.checked');
    cy.get('[data-cy="broadbandSplitType-no"]').should('be.checked');

    // Switch back to "Income Ratio"
    cy.get('[data-cy="masterUtilities-yes"]').check({ force: true });
    cy.get('[data-cy="councilTaxSplitType-yes"]').should('be.checked');
    cy.get('[data-cy="energySplitType-yes"]').should('be.checked');
  });

  it('persists theme selection across screens and page reloads', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();

    // Initial theme should be light (no data-theme="dark")
    cy.get('html').should('not.have.attr', 'data-theme', 'dark');

    // Toggle dark mode
    cy.get('[data-ui="themeToggle"]').click({ force: true });
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Navigate a few screens
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Reload page
    cy.reload();
    cy.disableAnimations();
    cy.waitForAppReady();

    // Verify dark mode persisted
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Go to Results
    cy.get('[data-cy="salaryP1-input"]').clear({ force: true }).type('50000', { force: true });
    cy.get('[data-cy="salaryP2-input"]').clear({ force: true }).type('50000', { force: true });
    
    // Screen 3
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="postcode-input"]').clear({ force: true }).type('SW1A 1AA', { force: true });
    cy.get('[data-cy="taxBand-C"]').check({ force: true });
    
    // Remaining screens
    cy.get('[data-cy="next-button"]').click({ force: true }); // Step 4
    cy.get('[data-cy="next-button"]').click({ force: true }); // Step 5
    cy.get('[data-cy="next-button"]').click({ force: true }); // Step 6
    cy.get('[data-cy="next-button"]').click({ force: true }); // Step 7

    cy.get('[data-cy="screen-7"]').should('exist');
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });
});
