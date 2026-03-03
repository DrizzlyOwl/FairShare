/**
 * Custom Cypress commands for FairShare E2E testing.
 */

Cypress.Commands.add('waitForAppReady', () => {
  cy.get('.lazy-loader', { timeout: 10000 }).should('not.exist');
  cy.window().should('have.property', 'app');
});

Cypress.Commands.add('skipToStep2', () => {
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-2').should('be.visible');
});

Cypress.Commands.add('fillIncomeStep', (p1 = '60000', p2 = '40000') => {
  cy.get('[data-cy="salaryP1-input"]').clear().type(p1).blur();
  cy.get('[data-cy="salaryP2-input"]').clear().type(p2).blur();
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-3').should('be.visible');
});

Cypress.Commands.add('fillPropertyStep', (postcode = 'M1 1AD', price = '300000', band = 'C') => {
  cy.get('[data-cy="postcode-input"]').clear().type(postcode).blur();
  cy.get('[data-cy="propertyPrice-input"]').clear().type(price).blur();
  cy.get(`label[for="b${band}"]`).click(); 
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-4', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('fillRegionalPropertyStep', (postcode, regionName, price = '400000', band = 'D') => {
  cy.get('[data-cy="postcode-input"]').clear().type(postcode).blur();
  cy.get('[data-ui="regionAnnouncement"]').should('be.visible').and('contain.text', regionName);
  cy.get('[data-cy="propertyPrice-input"]').clear().type(price).blur();
  cy.get(`label[for="b${band}"]`).click(); 
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-4', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('fillMortgageStep', () => {
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-5', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('fillUtilitiesStep', (council = '150', energy = '100', water = '30', broadband = '35') => {
  cy.get('[data-cy="councilTaxCost-input"]').clear().type(council);
  cy.get('[data-cy="energyCost-input"]').clear().type(energy);
  cy.get('[data-cy="waterBill-input"]').clear().type(water);
  cy.get('[data-cy="broadbandCost-input"]').clear().type(broadband);
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-6', { timeout: 10000 }).should('be.visible');
});

Cypress.Commands.add('fillLifestyleStep', (groceries = '400', childcare = '0', insurance = '50', other = '100') => {
  cy.get('[data-cy="groceriesCost-input"]').clear().type(groceries);
  cy.get('[data-cy="childcareCost-input"]').clear().type(childcare);
  cy.get('[data-cy="insuranceCost-input"]').clear().type(insurance);
  cy.get('[data-cy="otherSharedCosts-input"]').clear().type(other);
  cy.get('[data-cy="next-button"]').click();
  cy.get('#screen-7').should('be.visible');
});

Cypress.Commands.add('enablePersistence', () => {
  cy.on('window:before:load', (win) => {
    win.__CYPRESS_PERSISTENCE__ = true;
  });
});

Cypress.Commands.add('disableAnimations', () => {
  cy.get('body').invoke('append', `
    <style>
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
      .lazy-loader { display: none !important; }
    </style>
  `);
});
