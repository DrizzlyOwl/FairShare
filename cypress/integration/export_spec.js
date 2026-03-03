describe('FairShare - CSV Export', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.on('window:before:load', (win) => {
      if (win.navigator && win.navigator.serviceWorker) {
        cy.stub(win.navigator.serviceWorker, 'register').resolves();
      }
    });
  });

  it('triggers a CSV download with correct data on the results screen', () => {
    cy.visit('index.html');
    cy.disableAnimations();
    cy.waitForAppReady();

    // Stub the CSV download method to prevent actual download and inspect arguments
    cy.window().then((win) => {
      cy.stub(win.CSV, 'download').as('csvDownload');
    });

    cy.skipToStep2();
    
    // Use specific values to verify in export
    const p1Salary = '60000';
    const p2Salary = '40000';
    cy.fillIncomeStep(p1Salary, p2Salary);
    
    cy.fillPropertyStep('M1 1AD', '300000', 'C');
    cy.fillMortgageStep();
    cy.fillUtilitiesStep();
    cy.fillLifestyleStep();

    cy.get('#screen-7').should('be.visible');

    // Click download button
    cy.get('#downloadCSVBtn').click();

    // Verify stub was called
    cy.get('@csvDownload').should('be.calledOnce');

    // Inspect the data passed to the download function
    cy.get('@csvDownload').then((stub) => {
      const stateArg = stub.getCall(0).args[0];
      const tableArg = stub.getCall(0).args[1];

      expect(stateArg.salaryP1).to.equal(60000);
      expect(stateArg.salaryP2).to.equal(40000);
      expect(stateArg.postcode).to.equal('M1 1AD');
      
      // Verify table argument is a DOM element
      expect(tableArg.tagName).to.equal('TABLE');
      expect(tableArg.id).to.equal('results-table');
    });
  });
});
