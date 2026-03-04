describe('FairShare - Regional Journey (Wales LTT)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.on('window:before:load', (win) => {
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
    });
  });

  it('correctly calculates LTT for a Welsh property purchase', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    cy.skipToStep2();
    
    // Equal salaries (50/50 ratio)
    cy.fillIncomeStep('50000', '50000');
    
    // Wales postcode (CF prefix)
    cy.fillRegionalPropertyStep('CF10 1EP', 'Wales', '400000', 'D');
    
    cy.fillMortgageStep();
    cy.fillUtilitiesStep();
    cy.fillLifestyleStep();

    cy.get('[data-cy="screen-7"]').should('be.visible');
    
    // 1. Verify regional tax label
    cy.get('[data-ui="upfrontTaxLabel"]').should('contain.text', 'Stamp Duty (LTT)');

    // 2. Verify LTT calculation (£400,000 in Wales = £9,950)
    cy.get('[data-ui="bdUpfrontTaxTotal"]').should('contain.text', '£9,950');

    // 3. Check ratio split (should be 50/50 upfront if income is equal)
    cy.get('[data-ui="ratioTextDesc"]').should('contain.text', '50% You');
  });
});
