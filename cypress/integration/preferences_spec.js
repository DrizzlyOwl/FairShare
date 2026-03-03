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

    cy.get('#screen-5').should('be.visible');

    // Default should be "Income Ratio" (yes)
    cy.get('input[name="councilTaxSplitType"][value="yes"]').should('be.checked');
    cy.get('input[name="energySplitType"][value="yes"]').should('be.checked');

    // Click "Split All Equally" master toggle
    cy.get('label[for="muEqual"]').click();

    // Verify all sub-items updated
    cy.get('input[name="councilTaxSplitType"][value="no"]').should('be.checked');
    cy.get('input[name="energySplitType"][value="no"]').should('be.checked');
    cy.get('input[name="waterSplitType"][value="no"]').should('be.checked');
    cy.get('input[name="broadbandSplitType"][value="no"]').should('be.checked');

    // Switch back to "Income Ratio"
    cy.get('label[for="muRatio"]').click();
    cy.get('input[name="councilTaxSplitType"][value="yes"]').should('be.checked');
    cy.get('input[name="energySplitType"][value="yes"]').should('be.checked');
  });

  it('persists theme selection across screens and page reloads', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();

    // Initial theme should be light (no data-theme="dark")
    cy.get('html').should('not.have.attr', 'data-theme', 'dark');

    // Toggle dark mode
    cy.get('#theme-toggle').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Navigate a few screens
    cy.skipToStep2();
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Reload page
    cy.reload();
    cy.disableAnimations();
    cy.waitForAppReady();

    // Verify dark mode persisted
    cy.get('html').should('have.attr', 'data-theme', 'dark');

    // Go to Results
    cy.fillIncomeStep('50000', '50000');
    cy.fillPropertyStep('SW1A 1AA', '300000', 'C');
    cy.fillMortgageStep();
    cy.fillUtilitiesStep();
    cy.fillLifestyleStep();

    cy.get('#screen-7').should('be.visible');
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });
});
