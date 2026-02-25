import 'cypress-axe';

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
  it('should be WCAG 2.0 AA compliant on all screens', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    
    // Disable animations
    cy.get('body').invoke('append', `
      <style>
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
      </style>
    `);
    
    cy.injectAxe();

    // 1. Landing Screen
    cy.log('Checking Landing Screen');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 2. Income Screen
    cy.log('Checking Income Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-2').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 3. Property Screen
    cy.log('Checking Property Screen');
    cy.get('[data-cy="salaryP1-input"]').type('35000');
    cy.get('[data-cy="salaryP2-input"]').type('45000');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-3').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 4. Mortgage Screen
    cy.log('Checking Mortgage Screen');
    cy.get('[data-cy="postcode-input"]').type('SW1A 1AA').blur();
    cy.get('[data-cy="taxBand-fieldset"] .segmented-control').contains('label', /^C$/).click();
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-4').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 5. Utilities Screen
    cy.log('Checking Utilities Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-5').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 6. Committed Screen
    cy.log('Checking Committed Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-6').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);

    // 7. Results Screen
    cy.log('Checking Results Screen');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-7').should('be.visible');
    cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2aa'] } }, terminalLog);
  });
});
