describe('FairShare E2E - Finalized Journey Suite', () => {
  beforeEach(() => {
    // 1. Force a clean start
    cy.clearLocalStorage();
    
    cy.on('window:before:load', (win) => {
      // Stub SW
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
      
      // 2. Disable animations for speed and stability
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

  const skipToStep2 = () => {
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-2').should('be.visible');
  };

  const fillPropertyStep = (postcode = 'M1 1AD', price = '300000', band = 'C') => {
    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="postcode-input"]').clear().type(postcode).blur();
    
    if (price) {
        cy.get('[data-cy="propertyPrice-input"]').clear().type(price).blur();
    } else {
        cy.get('[data-cy="estimatePrice-button"]').click();
        cy.wait('@landRegistry');
    }
    
    cy.get(`label[for="b${band}"]`).click(); 
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-4', { timeout: 10000 }).should('be.visible');
  };

  const fillMortgageStep = () => {
    cy.get('#screen-4').should('be.visible');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-5').should('be.visible');
  };

  const fillUtilitiesStep = () => {
    cy.get('#screen-5', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="councilTaxCost-input"]').clear().type('150');
    cy.get('[data-cy="energyCost-input"]').clear().type('100');
    cy.get('[data-cy="waterBill-input"]').clear().type('30');
    cy.get('[data-cy="broadbandCost-input"]').clear().type('35');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-6', { timeout: 10000 }).should('be.visible');
  };

  const fillLifestyleStep = () => {
    cy.get('#screen-6', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy="groceriesCost-input"]').clear().type('400');
    cy.get('[data-cy="childcareCost-input"]').clear().type('0');
    cy.get('[data-cy="insuranceCost-input"]').clear().type('50');
    cy.get('[data-cy="otherSharedCosts-input"]').clear().type('100');
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-7', { timeout: 10000 }).should('be.visible');
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

    // 60k/40k England take-home results in ~59% ratio
    cy.get('[data-cy="ratio-bar-p1"]').invoke('text').then(text => {
        const perc = parseFloat(text);
        expect(perc).to.be.closeTo(59, 2);
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

  it('adjusts for Scottish regional variations (EH postcode)', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('50000');
    cy.get('[data-cy="next-button"]').click();

    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="postcode-input"]').type('EH1 1AD').blur();
    cy.get('#region-announcement').should('contain.text', 'Scotland');
    cy.get('[data-cy="propertyPrice-input"]').clear().type('300000');
    cy.get('label[for="bD"]').click();
    cy.get('[data-cy="next-button"]').click();
    
    cy.get('#screen-4').should('be.visible');
    cy.get('#totalUpfrontDisplay').should('contain.text', '£35,800');
  });

  it('applies surcharge for additional property purchase', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('50000');
    cy.get('[data-cy="next-button"]').click();

    fillPropertyStep('SW1A 1AA', '300000', 'C');

    cy.get('#totalUpfrontDisplay').should('contain.text', '£36,200');

    // Click "Buy-to-let"
    cy.get('label[for="homeSecond"]').click();
    cy.get('#totalUpfrontDisplay', { timeout: 10000 }).should('contain.text', '£45,200');
  });

  it('calculates results for mixed split preferences', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryType-net"]').check({ force: true });
    cy.get('[data-cy="salaryP1-input"]').clear().type('3000'); 
    cy.get('[data-cy="salaryP2-input"]').clear().type('2000'); // 60/40 ratio
    cy.get('[data-cy="next-button"]').click();
    
    fillPropertyStep('M1 1AD', '300000', 'C');
    fillMortgageStep();

    cy.get('#screen-5').should('be.visible');
    cy.get('[data-cy="councilTaxCost-input"]').clear().type('200');
    cy.get('label[for="ctPropNo"]').click(); // 50/50 split -> £100
    cy.get('[data-cy="energyCost-input"]').clear().type('100'); // Ratio split (60%) -> £60
    
    // Fill remaining mandatory fields on Screen 5 to pass validation
    cy.get('[data-cy="waterBill-input"]').clear().type('30');
    cy.get('[data-cy="broadbandCost-input"]').clear().type('35');
    
    cy.get('[data-cy="next-button"]').click();
    fillLifestyleStep();

    cy.get('#bd-tax-p1').should('contain.text', '£100');
    cy.get('#bd-energy-p1').should('contain.text', '£60');
  });

  it('back-calculates percentages for fixed amount deposits', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
    cy.get('[data-cy="salaryP2-input"]').clear().type('50000');
    cy.get('[data-cy="next-button"]').click();

    fillPropertyStep('M1 1AD', '200000', 'C');

    cy.get('#screen-4').should('be.visible');
    cy.get('[data-cy="depositPercentage-input"]').should('have.value', '10.0');
    cy.get('label[for="dtAmt"]').click(); 
    cy.get('[data-cy="depositAmount-input"]').type('{selectall}50000').blur();
    cy.wait(1000);
    
    cy.get('[data-cy="depositPercentage-input"]').should('have.value', '25.0');
  });

  it('clears state and returns to landing when clicking Start Over', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').type('99999');
    
    cy.get('[data-cy="start-over-button"]').click({ force: true });
    
    // Explicitly check for screen transition
    cy.get('#screen-1', { timeout: 10000 }).should('be.visible');
    cy.get('.progress__text').should('contain.text', 'Step 1');
  });

  it('verifies in-memory state consistency across screens', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('[data-cy="salaryP1-input"]').clear().type('12345');
    cy.get('[data-cy="next-button"]').click();
    
    cy.get('#screen-3').should('be.visible');
    cy.get('[data-cy="back-button"]').click();
    cy.get('[data-cy="salaryP1-input"]').should('have.value', '12345');
  });

  it('switches between Gross and Net income types', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('#salaryP1Label').should('contain.text', 'Annual');
    
    cy.get('[data-cy="salaryType-net"]').check({ force: true });
    cy.get('#salaryP1Label').should('contain.text', 'Monthly Take-home Pay');
  });
});
