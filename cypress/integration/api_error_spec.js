describe('FairShare - API Error Resilience', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('shows error message when property price estimation fails and allows manual entry', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();

    // Stub the API service method to throw an error
    cy.window().then((win) => {
      cy.stub(win.ApiService, 'getEstimatedPropertyPrice').rejects(new Error('Network Failure'));
    });
    
    cy.skipToStep2();
    cy.fillIncomeStep('50000', '50000');

    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="postcode-input"]').type('SW1A 1AA').blur();
    
    // Click Estimate button
    cy.get('[data-cy="estimatePrice-button"]').click();
    
    // Verify error message is shown on screen 3
    cy.get('#warning-screen-3').should('be.visible')
      .and('contain.text', 'Failed to estimate property price. Please enter manually.');

    // Ensure we can still enter a price manually and proceed
    cy.get('[data-cy="propertyPrice-input"]').clear().type('350000').blur();
    
    // MUST select a tax band for validation to pass
    cy.get('label[for="bC"]').click();

    // Next button should work
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-4').should('be.visible');
  });

  it('handles the fallback logic when API returns no results', () => {
    // Intercept Land Registry API and return empty results
    // This will trigger the CATCH block inside ApiService.js, which returns a fallback object
    cy.intercept('GET', '**/landregistry/query*', {
      body: { results: { bindings: [] } }
    }).as('priceEstimateEmpty');

    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();
    
    cy.skipToStep2();
    cy.fillIncomeStep('50000', '50000');

    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="postcode-input"]').type('M1 1AD').blur();
    
    // Click Estimate button
    cy.get('[data-cy="estimatePrice-button"]').click();
    
    cy.wait('@priceEstimateEmpty');

    // Should show the fallback price info (M prefix = £180,000 base)
    cy.get('[data-ui="propertyPriceEstimateDisplay"]').should('be.visible')
      .and('contain.text', 'Using estimated market price');
    
    cy.get('[data-cy="propertyPrice-input"]').should('have.value', '180000');
  });
});
