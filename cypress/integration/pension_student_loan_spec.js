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
        cy.get('[data-cy="screen-2"]').should('be.visible');
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

        // Both start at £50,000 (50/50 split)
        // Partner 1: £50,000, 10% Pension, Plan 1
        // Partner 2: £50,000, 0% Pension, None
        // Partner 1 MUST have a lower share (<50%) because their net pay will be lower
        
        cy.get('[data-cy="salaryP1-input"]').clear({ force: true }).type('50000', { force: true }).blur();
        cy.wait(500);
        cy.get('[data-cy="pensionP1-input"]').clear({ force: true }).type('10', { force: true }).blur();
        cy.wait(500);
        
        // Select Student Loan Plan 1 (Radio)
        cy.get('[data-cy="studentLoanP1-plan1"]').check({ force: true });
        cy.wait(500);

        cy.get('[data-cy="salaryP2-input"]').clear({ force: true }).type('50000', { force: true }).blur();
        
        // Wait for calculation to finish
        cy.wait(2000);

        // Move through screens to results
        cy.get('[data-cy="next-button"]').click({ force: true }); // Step 2 -> 3
        cy.get('[data-cy="screen-3"]', { timeout: 10000 }).should('be.visible');
        
        cy.fillPropertyStep('M1 1AD', '200000', 'A');
        
        cy.get('[data-cy="screen-4"]', { timeout: 10000 }).should('not.have.attr', 'hidden');
        cy.get('[data-cy="next-button"]').click({ force: true }); // Mortgage (Step 4 -> 5)
        
        cy.get('[data-cy="screen-5"]', { timeout: 10000 }).should('not.have.attr', 'hidden');
        cy.fillUtilitiesStep();
        
        cy.get('[data-cy="screen-6"]', { timeout: 10000 }).should('not.have.attr', 'hidden');
        cy.fillLifestyleStep();

        cy.wait(5000); // Wait for final result stabilization
        cy.get('[data-cy="screen-7"]', { timeout: 10000 }).should('not.have.attr', 'hidden');

        // Check ratio workings with a long timeout
        // Use should(callback) to retry and log inside
        cy.get('[data-cy="wk-p1-perc"]', { timeout: 15000 }).should(($el) => {
            const text = $el.text().trim();
            expect(text).to.not.equal('0%');
            expect(text).to.not.equal('');

            const perc = parseFloat(text.replace('%', ''));
            expect(perc).to.be.lessThan(50);
            expect(perc).to.be.greaterThan(0);
        });

        cy.get('[data-cy="wk-p2-perc"]').invoke('text').then((text) => {
            const perc = parseFloat(text.replace('%', ''));
            expect(perc).to.be.greaterThan(50);
        });
    });
});
