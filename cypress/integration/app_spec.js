describe('FairShare App', () => {
  beforeEach(() => {
    // Unregister existing service workers
    if (window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
    cy.clearLocalStorage();

    // Prevent Service Worker registration during test
    cy.on('window:before:load', (win) => {
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
    });

    // Stub Land Registry API
    cy.intercept('GET', '**/landregistry/query*', {
      body: {
        results: {
          bindings: [
            { amount: { value: '250000' } }
          ]
        }
      }
    }).as('landRegistry');

    cy.visit('index.html');
  });

  const fillStep1 = () => {
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-2').should('be.visible');
    cy.get('[data-cy="salaryP1-input"]').type('35000');
    cy.get('[data-cy="salaryP2-input"]').type('45000');
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-3').should('be.visible');
  };

  const fillStep2 = (postcode) => {
    cy.get('[data-cy="postcode-input"]').clear().type(postcode);
    cy.get('[data-cy="postcode-input"]').blur();
    // Use a more specific selector for the tax band label to avoid matching other text
    cy.get('[data-cy="taxBand-fieldset"] .segmented-control').contains('label', /^C$/).click();
    cy.get('[data-cy="bedrooms-input"]').clear().type('3');
    cy.get('[data-cy="bathrooms-input"]').clear().type('2');
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-4').should('be.visible');
  };

  const fillStep3 = () => {
    cy.get('[data-cy="depositPercentage-input"]').clear().type('10');
    cy.get('[data-cy="mortgageInterestRate-input"]').clear().type('5');
    cy.get('[data-cy="mortgageTerm-input"]').clear().type('25');
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-5').should('be.visible');
  };

  const fillStep4 = () => {
    cy.get('[data-cy="councilTaxCost-input"]').should('not.have.value', ''); // Should be pre-filled
    cy.get('[data-cy="energyCost-input"]').should('not.have.value', ''); // Should be pre-filled
    cy.get('[data-cy="waterBill-input"]').should('not.have.value', ''); // Should be pre-filled
    cy.get('[data-cy="broadbandCost-input"]').type('35');
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-6').should('be.visible');
  };

  const fillStep5 = () => {
    cy.get('[data-cy="groceriesCost-input"]').type('400');
    cy.get('[data-cy="childcareCost-input"]').type('0');
    cy.get('[data-cy="insuranceCost-input"]').type('50');
    cy.get('[data-cy="otherSharedCosts-input"]').type('100');
    cy.get('[data-cy="next-button"]').click({ force: true });
  };

  it('should calculate heating estimates correctly for a northern region', () => {
    fillStep1();
    fillStep2('M1 1AD'); // Manchester
    cy.get('#region-announcement').should('contain.text', 'North of England region detected. Heating estimates adjusted.');
    fillStep3();

    cy.get('[data-cy="energyCost-input"]').invoke('val').then((energyCost) => {
      const northernEnergyCost = parseFloat(energyCost);

      // Go back and change to a southern postcode
      cy.get('[data-cy="back-button"]').click({ force: true });
      cy.get('[data-cy="back-button"]').click({ force: true });
      fillStep2('SW1A 0AA'); // London
      cy.get('#region-announcement').should('contain.text', 'London region detected.');
      fillStep3();

      cy.get('[data-cy="energyCost-input"]').invoke('val').then((southernEnergyCost) => {
        expect(northernEnergyCost).to.be.gt(parseFloat(southernEnergyCost));
      });
    });
  });

  it('should calculate heating estimates correctly for a southern region', () => {
    fillStep1();
    fillStep2('SW1A 0AA'); // London
    cy.get('#region-announcement').should('contain.text', 'London region detected.');
    fillStep3();

    cy.get('[data-cy="energyCost-input"]').invoke('val').then((energyCost) => {
      const southernEnergyCost = parseFloat(energyCost);

      // Go back and change to a northern postcode
      cy.get('[data-cy="back-button"]').click({ force: true });
      cy.get('[data-cy="back-button"]').click({ force: true });
      fillStep2('M1 1AD'); // Manchester
      cy.get('#region-announcement').should('contain.text', 'North of England region detected. Heating estimates adjusted.');
      fillStep3();

      cy.get('[data-cy="energyCost-input"]').invoke('val').then((northernEnergyCost) => {
        expect(southernEnergyCost).to.be.lt(parseFloat(northernEnergyCost));
      });
    });
  });

  it('should prevent navigation if required fields are empty', () => {
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('#screen-2').should('be.visible');

    // Try clicking next without entering salaries
    cy.get('[data-cy="next-button"]').click({ force: true });

    // Should stay on screen 2 and show errors
    cy.get('#screen-2').should('be.visible');
    cy.get('#salaryP1-error').should('be.visible');
    cy.get('#salaryP2-error').should('be.visible');

    // Fill one field
    cy.get('[data-cy="salaryP1-input"]').type('30000');
    cy.get('[data-cy="next-button"]').click({ force: true });

    // Should still stay on screen 2
    cy.get('#screen-2').should('be.visible');
    cy.get('#salaryP2-error').should('be.visible');
  });

  it('should persist entered data across page reloads', () => {
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="salaryP1-input"]').type('55000');
    cy.get('[data-cy="salaryP2-input"]').type('65000');

    // Wait for debounce to settle before reloading
    cy.wait(500);

    // Reload the page
    cy.reload();

    // Check if values persisted
    cy.get('[data-cy="next-button"]').click({ force: true }); // Go to screen 2
    cy.get('[data-cy="salaryP1-input"]').should('have.value', '55000');
    cy.get('[data-cy="salaryP2-input"]').should('have.value', '65000');
  });

  it('should allow a complete user journey and display the results screen', () => {
    fillStep1();
    fillStep2('SW1A 0AA');
    fillStep3();
    fillStep4();
    fillStep5();

    cy.get('#screen-7').should('be.visible');

    // Results screen assertions
    cy.get('[data-cy="result-p1"]').should('not.have.text', '£0');
    cy.get('[data-cy="result-p2"]').should('not.have.text', '£0');
    cy.get('[data-cy="total-bill-display"]').should('not.have.text', '£0');

    // Check if the ratio bar is updated (You earn 35k, Partner earns 45k -> Ratio is roughly 44% / 56%)
    cy.get('[data-cy="ratio-bar-p1"]').invoke('text').then((text) => {
      const percentage = parseInt(text);
      expect(percentage).to.be.closeTo(44, 1);
    });
  });

  it('should toggle between gross and net salary types correctly', () => {
    cy.get('[data-cy="next-button"]').click({ force: true });
    
    // Default should be Annual Gross
    cy.get('#salaryP1Label').should('contain.text', 'Annual Salary (Pre-tax)');
    cy.get('[data-cy="salaryP1-input"]').should('have.attr', 'placeholder', 'e.g. 35000');
    
    // Switch to Monthly Net
    cy.get('label[for="stNet"]').click();
    cy.get('#salaryP1Label').should('contain.text', 'Monthly Take-home Pay');
    cy.get('[data-cy="salaryP1-input"]').should('have.attr', 'placeholder', 'e.g. 2500');
    
    // Enter some net values
    cy.get('[data-cy="salaryP1-input"]').type('3000');
    cy.get('[data-cy="salaryP2-input"]').type('3000'); // 50/50 ratio
    
    // Switch back to Gross
    cy.get('label[for="stGross"]').click();
    cy.get('#salaryP1Label').should('contain.text', 'Annual Salary (Pre-tax)');
    
    // Complete journey and check workings
    cy.get('[data-cy="next-button"]').click({ force: true });
    fillStep2('SW1A 0AA');
    fillStep3();
    fillStep4();
    fillStep5();
    
    cy.get('#screen-7').should('be.visible');
    cy.get('#wk-income-subtitle').should('contain.text', 'Annual');
    cy.get('#wk-p1-perc').should('contain.text', '50.0%');
  });

  it('should include optional mortgage fees in upfront cash calculation', () => {
    fillStep1();
    fillStep2('SW1A 0AA'); // London
    
    // On Mortgage screen (Step 4)
    cy.get('#screen-4').should('be.visible');
    
    // Explicitly set deposit to 10% to match previous test expectations
    cy.get('[data-cy="depositPercentage-input"]').clear().type('10');
    
    // Default upfront cash (10% of 250k = 25k, plus SDLT/Legal)
    // Intercepted price is 250k.
    // 10% deposit = 25k.
    // SDLT for 250k Standard in EN = (125k * 0) + (125k * 0.02) = 2500.
    // Legal fees for 250k = 1200.
    // Total = 25000 + 2500 + 1200 = 28700.
    
    cy.get('#totalUpfrontDisplay').should('contain.text', '£28,700');
    
    // Add mortgage fees
    cy.get('summary.details-box__summary').click();
    cy.get('[data-cy="mortgageFees-input"]').type('999');
    
    // New total = 28700 + 999 = 29699
    cy.get('#totalUpfrontDisplay').should('contain.text', '£29,699');
  });

  it('should display Scottish tax bands for a Scottish postcode', () => {
    // 1. Enter salaries
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="salaryP1-input"]').type('30000');
    cy.get('[data-cy="salaryP2-input"]').type('40000');
    
    // 2. Go to Property screen and enter Scottish postcode
    cy.get('[data-cy="next-button"]').click({ force: true });
    cy.get('[data-cy="postcode-input"]').type('EH1 1AD'); // Edinburgh
    cy.get('[data-cy="postcode-input"]').blur();
    cy.get('#region-announcement').should('contain.text', 'Scotland region detected.');
    
    // 3. Go back to Income screen and check for Scottish badges
    cy.get('[data-cy="back-button"]').click({ force: true });
    
    // £30k in Scotland is Intermediate Rate
    cy.get('#salaryP1-tax-badge').should('be.visible').and('contain.text', 'Intermediate Rate');
    // £40k in Scotland is also Intermediate Rate (up to £43,662)
    cy.get('#salaryP2-tax-badge').should('be.visible').and('contain.text', 'Intermediate Rate');
  });

  it('should allow specifying deposit as a fixed amount', () => {
    fillStep1();
    fillStep2('SW1A 0AA');
    
    // Switch to Fixed Amount
    cy.get('label[for="dtAmt"]').click();
    cy.get('#depositAmtContainer').should('be.visible');
    cy.get('#depositPercContainer').should('not.be.visible');
    
    // Enter £50,000 deposit
    cy.get('[data-cy="depositAmount-input"]').clear().type('50000');
    
    // Check if percentage was calculated correctly (50k / 250k = 20%)
    cy.get('[data-cy="depositPercentage-input"]').should('have.value', '20.0');
    
    // Check upfront summary
    // 50000 (deposit) + 2500 (sdlt) + 1200 (legal) = 53700
    cy.get('#totalUpfrontDisplay').should('contain.text', '£53,700');
  });
});
