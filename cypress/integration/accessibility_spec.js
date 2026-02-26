import 'cypress-axe';

/**
 * Custom logger for accessibility violations to provide more detail in CI output.
 * @param {Array} violations - Array of violation objects from axe-core.
 */
function terminalLog(violations) {
  cy.task(
    'log',
    `${violations.length} accessibility violation${
      violations.length === 1 ? '' : 's'
    } ${violations.length === 1 ? 'was' : 'were'} detected`
  );
  const violationData = violations.map(
    ({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
      targets: nodes.map(n => n.target).join(', ')
    })
  );

  cy.task('table', violationData);
}

describe('Accessibility CI Test', () => {
  beforeEach(() => {
    cy.clearLocalStorage();

    // Stub the Land Registry API
    cy.intercept('GET', '**/landregistry/query*', {
      body: { results: { bindings: [{ amount: { value: '300000' } }] } }
    }).as('landRegistry');

    cy.visit('index.html');
    
    // Disable animations and hide loader for stable testing
    cy.get('body').invoke('append', `
      <style>
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
        .lazy-loader { display: none !important; }
      </style>
    `);
    
    cy.get('.lazy-loader', { timeout: 10000 }).should('not.exist');
    cy.injectAxe();
  });

  it('should be WCAG 2.1 AA compliant on all screens', () => {
    const checkA11yOptions = { 
        runOnly: { type: 'tag', values: ['wcag21aa', 'wcag2aa'] } 
    };

    // 1. Landing Screen
    cy.log('Checking Landing Screen');
    cy.get('#screen-1').should('be.visible');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 2. Income Screen
    cy.log('Checking Income Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-2').should('be.visible');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 3. Property Screen
    cy.log('Checking Property Screen');
    cy.get('[data-cy="salaryP1-input"]').type('35000').blur();
    cy.get('[data-cy="salaryP2-input"]').type('45000').blur();
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-3').should('be.visible');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 4. Mortgage Screen
    cy.log('Checking Mortgage Screen');
    cy.get('[data-cy="postcode-input"]').type('SW1A 1AA').blur();
    cy.get('[data-cy="taxBand-C"]').check({ force: true }).should('be.checked');
    cy.get('[data-cy="estimatePrice-button"]').click();
    cy.wait('@landRegistry');
    cy.get('[data-cy="propertyPrice-input"]').should('have.value', '300000');
    
    cy.get('[data-cy="bedrooms-input"]').clear().type('3');
    cy.get('[data-cy="bathrooms-input"]').clear().type('2');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-4').should('be.visible');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 5. Utilities Screen
    cy.log('Checking Utilities Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-5').should('be.visible');

    cy.get('[data-cy="councilTaxCost-input"]').clear().type('150');
    cy.get('[data-cy="energyCost-input"]').clear().type('100');
    cy.get('[data-cy="waterBill-input"]').clear().type('30');
    cy.get('[data-cy="broadbandCost-input"]').clear().type('35');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 6. Committed Screen
    cy.log('Checking Committed Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-6').should('be.visible');

    cy.get('[data-cy="groceriesCost-input"]').clear().type('400');
    cy.get('[data-cy="childcareCost-input"]').clear().type('0');
    cy.get('[data-cy="insuranceCost-input"]').clear().type('50');
    cy.get('[data-cy="otherSharedCosts-input"]').clear().type('100');
    cy.checkA11y(null, checkA11yOptions, terminalLog);

    // 7. Results Screen
    cy.log('Checking Results Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-7').should('be.visible');
    cy.checkA11y(null, checkA11yOptions, terminalLog);
  });
});
