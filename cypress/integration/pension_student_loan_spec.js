describe('FairShare - Pension & Student Loan Logic', () => {
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

    const skipToStep2 = () => {
        cy.visit('index.html');
        cy.get('[data-cy="next-button"]').click();
        cy.get('#screen-2').should('be.visible');
    };

    it('toggles visibility of pension and student loan fields based on income type', () => {
        skipToStep2();
        
        // Default is Gross, fields should be visible
        cy.get('[data-cy="pensionSlContainerP1"]').should('be.visible');
        cy.get('[data-cy="pensionSlContainerP2"]').should('be.visible');

        // Switch to Net, fields should be hidden
        cy.get('[data-cy="salaryType-net"]').check({ force: true });
        cy.get('[data-cy="pensionSlContainerP1"]').should('not.be.visible');
        cy.get('[data-cy="pensionSlContainerP2"]').should('not.be.visible');

        // Switch back to Gross
        cy.get('[data-cy="salaryType-gross"]').check({ force: true });
        cy.get('[data-cy="pensionSlContainerP1"]').should('be.visible');
        cy.get('[data-cy="pensionSlContainerP2"]').should('be.visible');
    });

    it('calculates ratios correctly when pension and student loans are applied', () => {
        skipToStep2();

        // Partner 1: £50,000, 10% Pension, Plan 1
        // Partner 2: £50,000, 0% Pension, None
        // Partner 1 should have a lower share because net is lower
        
        cy.get('[data-cy="salaryP1-input"]').clear().type('50000');
        cy.get('[data-cy="pensionP1-input"]').clear().type('10');
        
        // Custom Select interaction
        cy.get('[data-cy="studentLoanP1-select"]').click();
        cy.get('.select-custom__option').contains('Plan 1').click();

        cy.get('[data-cy="salaryP2-input"]').clear().type('50000');
        
        // Wait for calculation debounce/re-render
        cy.wait(500);

        // Move through screens to results
        cy.get('[data-cy="next-button"]').click(); // Property
        cy.get('[data-cy="postcode-input"]').type('M1 1AD');
        cy.get('[data-cy="propertyPrice-input"]').clear().type('200000');
        cy.get('label[for="bA"]').click();
        cy.get('[data-cy="next-button"]').click(); // Mortgage
        cy.get('[data-cy="next-button"]').click(); // Utilities
        cy.get('[data-cy="next-button"]').click(); // Committed
        
        cy.get('#screen-7').should('be.visible');

        // Check ratio workings
        // Partner 1 should have < 50% share
        cy.get('[data-cy="wk-p1-perc"]').invoke('text').then((text) => {
            const perc = parseFloat(text.replace('%', ''));
            expect(perc).to.be.lessThan(50);
        });

        cy.get('[data-cy="wk-p2-perc"]').invoke('text').then((text) => {
            const perc = parseFloat(text.replace('%', ''));
            expect(perc).to.be.greaterThan(50);
        });
    });
});
