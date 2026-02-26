describe('FairShare - Property & Regional Rules', () => {
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

    cy.intercept('GET', '**/landregistry/query*', {
      body: { results: { bindings: [{ amount: { value: '300000' } }] } }
    }).as('landRegistry');
  });

  const waitForAppReady = () => {
    cy.get('.lazy-loader', { timeout: 10000 }).should('not.exist');
    cy.window().should('have.property', 'app');
  };

  const setupBaseIncome = () => {
    cy.visit('index.html');
    waitForAppReady();
    cy.get('[data-cy="next-button"]').click();
    cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('50000');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-3').should('be.visible');
  };

  const fillPropertyStep = (postcode = 'M1 1AD', price = '300000', band = 'C') => {
    cy.get('[data-cy="postcode-input"]').clear().type(postcode).blur();
    cy.get('[data-cy="propertyPrice-input"]').clear().type(price).blur();
    cy.get(`label[for="b${band}"]`).click(); 
    cy.get('[data-cy="next-button"]').click();
  };

  it('adjusts for Scottish regional variations (EH postcode)', () => {
    setupBaseIncome();
    cy.get('[data-cy="postcode-input"]').type('EH1 1AD').blur();
    cy.get('#region-announcement').should('contain.text', 'Scotland');
    cy.get('[data-cy="propertyPrice-input"]').clear().type('300000').blur();
    cy.get('label[for="bD"]').click();
    cy.get('[data-cy="next-button"]').click();
    
    cy.get('#screen-4').should('be.visible');
    cy.get('#totalUpfrontDisplay').should('contain.text', '£35,800');
  });

  it('applies surcharge for additional property purchase', () => {
    setupBaseIncome();
    fillPropertyStep('SW1A 1AA', '300000', 'C');

    cy.get('#screen-4').should('be.visible');
    // Initial: 10% (30k) + SDLT (5k) + Legal (1200) = £36,200
    cy.get('#totalUpfrontDisplay').should('contain.text', '£36,200');

    // Select "Buy-to-let" on screen 4
    cy.get('label[for="homeSecond"]').click();
    // Additional Surcharge (+3% of 300k = +9k): 36,200 + 9,000 = £45,200
    cy.get('#totalUpfrontDisplay', { timeout: 10000 }).should('contain.text', '£45,200');
  });

  it('back-calculates percentages for fixed amount deposits', () => {
    setupBaseIncome();
    fillPropertyStep('M1 1AD', '200000', 'C');

    cy.get('#screen-4').should('be.visible');
    // Orchestrator returns 10.0 (fixed decimals)
    cy.get('[data-cy="depositPercentage-input"]').should('have.value', '10.0');
    cy.get('label[for="dtAmt"]').click(); 
    
    // Use selectall to ensure it's cleared before typing
    cy.get('[data-cy="depositAmount-input"]').type('{selectall}50000').blur();
    
    cy.get('[data-cy="depositPercentage-input"]').should('have.value', '25.0');
  });
});
