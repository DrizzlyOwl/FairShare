describe('FairShare - Calculation Details Validation', () => {
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

    it('validates that calculation details accurately reflect input values and results', () => {
        cy.visit('index.html');
        cy.get('[data-cy="next-button"]').click();

        // Screen 2: Income
        cy.get('[data-cy="salaryP1-input"]').clear().type('60000');
        cy.get('[data-cy="salaryP2-input"]').clear().type('40000');
        cy.get('[data-cy="next-button"]').click();

        // Screen 3: Property
        cy.get('[data-cy="postcode-input"]').type('M1 1AD').blur();
        cy.get('[data-cy="propertyPrice-input"]').clear().type('300000').blur();
        cy.get('label[for="bC"]').click();
        cy.get('[data-cy="next-button"]').click();

        // Screen 4: Mortgage & Equity
        cy.get('[data-cy="depositPercentage-input"]').type('{selectall}10').blur();
        cy.get('[data-cy="mortgageInterestRate-input"]').type('{selectall}5').blur();
        cy.get('[data-cy="mortgageTerm-input"]').type('{selectall}25').blur();
        cy.get('[data-cy="next-button"]').click();

        // Screen 5: Utilities (use defaults)
        cy.get('[data-cy="next-button"]').click();

        // Screen 6: Committed (use defaults)
        cy.get('[data-cy="next-button"]').click();

        // Screen 7: Results
        cy.get('#screen-7').should('be.visible');

        // Validate Income Ratio Workings
        cy.get('[data-cy="wk-salary-p1"]').should('contain.text', '£60,000');
        
        // Validate Mortgage & Terms Workings
        cy.get('[data-cy="wk-property-price"]').should('contain.text', '£300,000');
        cy.get('[data-cy="wk-deposit-perc"]').should('contain.text', '10.0%');
        cy.get('[data-cy="wk-total-equity"]').should('contain.text', '£30,000');
        cy.get('[data-cy="wk-interest-rate"]').should('contain.text', '5%');
        cy.get('[data-cy="wk-mortgage-term"]').should('have.text', '25');
        
        // Repayments (Principal 270k, 5%, 25y) -> ~£1,578.39 (Monthly) / £473,517.93 (Total)
        cy.get('[data-cy="wk-monthly-payment"]').should('contain.text', '£1,578.39');
        cy.get('[data-cy="wk-total-repayment"]').should('contain.text', '£473,517.93');
    });

    it('updates calculation details when using 50/50 deposit split', () => {
        cy.visit('index.html');
        cy.get('[data-cy="next-button"]').click();

        // Screen 2: Income
        cy.get('[data-cy="salaryP1-input"]').clear().type('60000');
        cy.get('[data-cy="salaryP2-input"]').clear().type('40000');
        cy.get('[data-cy="next-button"]').click();

        // Screen 3: Property
        cy.get('[data-cy="postcode-input"]').type('M1 1AD').blur();
        cy.get('[data-cy="propertyPrice-input"]').clear().type('300000').blur();
        cy.get('label[for="bC"]').click();
        cy.get('[data-cy="next-button"]').click();

        // Screen 4: Mortgage & Equity
        cy.get('label[for="splitPropNo"]').click(); // 50/50 split
        cy.get('[data-cy="next-button"]').click();

        // Navigate to Results
        cy.get('[data-cy="next-button"]').click(); // Utilities
        cy.get('[data-cy="next-button"]').click(); // Committed

        cy.get('#screen-7', { timeout: 10000 }).should('be.visible');
        cy.get('[data-cy="wk-deposit-split-type"]').should('contain.text', '50/50');
    });
});
