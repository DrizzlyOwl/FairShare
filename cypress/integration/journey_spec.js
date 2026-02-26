describe('FairShare - Main User Journeys', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.on('window:before:load', (win) => {
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
      const style = win.document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
        .lazy-loader { display: none !important; }
      `;
      win.document.head.appendChild(style);
    });
  });

  const waitForAppReady = () => {
    cy.get('.lazy-loader', { timeout: 10000 }).should('not.exist');
    cy.window().should('have.property', 'app');
  };

  const skipToStep2 = () => {
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-2').should('be.visible');
  };

  const fillPropertyStep = (postcode = 'M1 1AD', price = '300000', band = 'C') => {
    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="postcode-input"]').clear().type(postcode).blur();
    cy.get('[data-cy="propertyPrice-input"]').clear().type(price).blur();
    cy.get(`label[for="b${band}"]`).click(); 
    cy.get('[data-cy="next-button"]').click();
  };

  const fillMortgageStep = () => {
    cy.get('#screen-4', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="next-button"]').click();
  };

  const fillUtilitiesStep = () => {
    cy.get('#screen-5', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="councilTaxCost-input"]').clear().type('150');
    cy.get('[data-cy="energyCost-input"]').clear().type('100');
    cy.get('[data-cy="waterBill-input"]').clear().type('30');
    cy.get('[data-cy="broadbandCost-input"]').clear().type('35');
    cy.get('[data-cy="next-button"]').click();
  };

  const fillLifestyleStep = () => {
    cy.get('#screen-6', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="groceriesCost-input"]').clear().type('400');
    cy.get('[data-cy="childcareCost-input"]').clear().type('0');
    cy.get('[data-cy="insuranceCost-input"]').clear().type('50');
    cy.get('[data-cy="otherSharedCosts-input"]').clear().type('100');
    cy.get('[data-cy="next-button"]').click();
  };

  it('completes a full user journey with income-based splitting', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('60000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('40000');
    cy.get('[data-cy="next-button"]').click();

    fillPropertyStep('M1 1AD', '300000', 'C');
    fillMortgageStep();
    fillUtilitiesStep();
    fillLifestyleStep();

    cy.get('#screen-7').should('be.visible');
    cy.get('[data-cy="ratio-bar-p1"]').invoke('text').then(text => {
        const perc = parseFloat(text);
        expect(perc).to.be.closeTo(58.4, 1);
    });
  });

  it('handles a single-income household (Partner 2 = £0)', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('0');
    cy.get('[data-cy="next-button"]').click();
    
    fillPropertyStep('M1 1AD', '300000', 'C');
    fillMortgageStep();
    fillUtilitiesStep();
    fillLifestyleStep();
    
    cy.get('[data-cy="ratio-bar-p1"]').should('contain.text', '100%');
  });

  it('clears state and returns to landing when clicking Start Over', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').type('99999');
    cy.get('[data-cy="start-over-button"]').click({ force: true });
    
    cy.get('#screen-1').should('be.visible');
    cy.get('.progress__text').should('contain.text', 'Step 1');
  });
});
