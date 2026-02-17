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

    cy.visit('index.html');
  });

  const fillStep1 = () => {
    cy.get('#next-button').click();
    cy.get('#screen-2').should('be.visible');
    cy.get('#salaryP1').type('35000');
    cy.get('#salaryP2').type('45000');
    cy.get('#next-button').click();
    cy.get('#screen-3').should('be.visible');
  };

  const fillStep2 = (postcode) => {
    cy.get('#postcode').clear().type(postcode);
    cy.get('#postcode').blur();
    cy.get('#bC').click();
    cy.get('#bedrooms').clear().type('3');
    cy.get('#bathrooms').clear().type('2');
    cy.get('#next-button').click();
    cy.get('#screen-4').should('be.visible');
  };

  const fillStep3 = () => {
    cy.get('#depositPercentage').clear().type('10');
    cy.get('#mortgageInterestRate').clear().type('5');
    cy.get('#mortgageTerm').clear().type('25');
    cy.get('#next-button').click();
    cy.get('#screen-5').should('be.visible');
  };
  
  const fillStep4 = () => {
    cy.get('#councilTaxCost').should('not.have.value', ''); // Should be pre-filled
    cy.get('#energyCost').should('not.have.value', ''); // Should be pre-filled
    cy.get('#waterBill').should('not.have.value', ''); // Should be pre-filled
    cy.get('#broadbandCost').type('35');
    cy.get('#next-button').click();
    cy.get('#screen-6').should('be.visible');
  };

  const fillStep5 = () => {
    cy.get('#groceriesCost').type('400');
    cy.get('#childcareCost').type('0');
    cy.get('#insuranceCost').type('50');
    cy.get('#otherSharedCosts').type('100');
    cy.get('#next-button').click();
    cy.get('#screen-7').should('be.visible');
  };

  it('should calculate heating estimates correctly for a northern region', () => {
    fillStep1();
    fillStep2('M1 1AD'); // Manchester
    cy.get('#region-announcement').should('contain.text', 'North of England region detected. Heating estimates adjusted.');
    fillStep3();

    cy.get('#energyCost').invoke('val').then((energyCost) => {
      const northernEnergyCost = parseFloat(energyCost);

      // Go back and change to a southern postcode
      cy.get('#back-button').click();
      cy.get('#back-button').click();
      fillStep2('SW1A 0AA'); // London
      cy.get('#region-announcement').should('contain.text', 'London region detected.');
      fillStep3();

      cy.get('#energyCost').invoke('val').then((southernEnergyCost) => {
        expect(northernEnergyCost).to.be.gt(parseFloat(southernEnergyCost));
      });
    });
  });

  it('should calculate heating estimates correctly for a southern region', () => {
    fillStep1();
    fillStep2('SW1A 0AA'); // London
    cy.get('#region-announcement').should('contain.text', 'London region detected.');
    fillStep3();

    cy.get('#energyCost').invoke('val').then((energyCost) => {
      const southernEnergyCost = parseFloat(energyCost);

      // Go back and change to a northern postcode
      cy.get('#back-button').click();
      cy.get('#back-button').click();
      fillStep2('M1 1AD'); // Manchester
      cy.get('#region-announcement').should('contain.text', 'North of England region detected. Heating estimates adjusted.');
      fillStep3();

      cy.get('#energyCost').invoke('val').then((northernEnergyCost) => {
        expect(southernEnergyCost).to.be.lt(parseFloat(northernEnergyCost));
      });
    });
  });

  it('should prevent navigation if required fields are empty', () => {
    cy.get('#next-button').click();
    cy.get('#screen-2').should('be.visible');
    
    // Try clicking next without entering salaries
    cy.get('#next-button').click();
    
    // Should stay on screen 2 and show errors
    cy.get('#screen-2').should('be.visible');
    cy.get('#salaryP1-error').should('be.visible');
    cy.get('#salaryP2-error').should('be.visible');
    
    // Fill one field
    cy.get('#salaryP1').type('30000');
    cy.get('#next-button').click();
    
    // Should still stay on screen 2
    cy.get('#screen-2').should('be.visible');
    cy.get('#salaryP2-error').should('be.visible');
  });

  it('should persist entered data across page reloads', () => {
    cy.get('#next-button').click();
    cy.get('#salaryP1').type('55000');
    cy.get('#salaryP2').type('65000');
    
    // Reload the page
    cy.reload();
    
    // Check if values persisted
    cy.get('#next-button').click(); // Go to screen 2
    cy.get('#salaryP1').should('have.value', '55000');
    cy.get('#salaryP2').should('have.value', '65000');
  });

  it('should allow a complete user journey and display the results screen', () => {
    fillStep1();
    fillStep2('SW1A 0AA');
    fillStep3();
    fillStep4();
    fillStep5();
    
    // Results screen assertions
    cy.get('#result-p1').should('not.have.text', '£0');
    cy.get('#result-p2').should('not.have.text', '£0');
    cy.get('#total-bill-display').should('not.have.text', '£0');
    
    // Check if the ratio bar is updated (You earn 35k, Partner earns 45k -> Ratio is roughly 44% / 56%)
    cy.get('#bar-p1').invoke('text').then((text) => {
      const percentage = parseInt(text);
      expect(percentage).to.be.closeTo(44, 1);
    });
  });
});
