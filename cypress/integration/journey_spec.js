describe('FairShare - Main User Journeys', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.on('window:before:load', (win) => {
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
    });
  });

  it('completes a full user journey with income-based splitting', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    cy.skipToStep2();
    
    cy.fillIncomeStep('60000', '40000');
    cy.fillPropertyStep('M1 1AD', '300000', 'C');
    cy.fillMortgageStep();
    cy.fillUtilitiesStep();
    cy.fillLifestyleStep();

    cy.get('[data-cy="screen-7"]').should('be.visible');
    cy.get('[data-ui="ratioTextDesc"]').should('contain.text', '58% You');
  });

  it('handles a single-income household (Partner 2 = £0)', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    cy.skipToStep2();
    
    cy.fillIncomeStep('50000', '0');
    cy.fillPropertyStep('M1 1AD', '300000', 'C');
    cy.fillMortgageStep();
    cy.fillUtilitiesStep();
    cy.fillLifestyleStep();
    
    cy.get('[data-ui="ratioTextDesc"]').should('contain.text', '100% You');
  });

  it('clears state and returns to landing when clicking Start Over', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    cy.skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').type('99999');
    cy.get('[data-cy="start-over-button"]').click({ force: true });
    
    cy.get('[data-cy="screen-1"]').should('be.visible');
    cy.get('.progress__text').should('contain.text', 'Step 1');
  });
});
