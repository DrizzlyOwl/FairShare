describe('FairShare - Income & Ratio Logic', () => {
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

  const waitForAppReady = () => {
    cy.get('.lazy-loader', { timeout: 10000 }).should('not.exist');
    cy.window().should('have.property', 'app');
  };

  const skipToStep2 = () => {
    cy.get('[data-cy="next-button"]').click();
    cy.get('#screen-2').should('be.visible');
  };

  it('switches between Gross and Net income types', () => {
    cy.visit('index.html');
    waitForAppReady();
    skipToStep2();
    cy.get('#salaryP1Label').should('contain.text', 'Annual');
    
    cy.get('[data-cy="salaryType-net"]').check({ force: true });
    cy.get('#salaryP1Label').should('contain.text', 'Monthly Take-home Pay');
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
});
