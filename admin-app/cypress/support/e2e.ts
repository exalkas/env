import "@testing-library/cypress/add-commands";

// Custom command for login
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get("input#email").type(email);
  cy.get("input#password").type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/login");
});

// Custom command for API authentication
Cypress.Commands.add("apiLogin", (email: string, password: string) => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: formData,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      window.localStorage.setItem("admin_token", response.body.access_token);
    }
  });
});

// Custom command for checking toast messages
Cypress.Commands.add("checkToast", (message: string) => {
  cy.get('[role="alert"]').should("contain", message);
});

// Custom command for waiting for loading states
Cypress.Commands.add("waitForLoading", () => {
  cy.get("button[disabled]").should("not.exist");
});

// Custom command for checking error messages
Cypress.Commands.add("checkError", (message: string) => {
  cy.get(".bg-red-100").should("contain", message);
});

// Custom command for checking info messages
Cypress.Commands.add("checkInfo", (message: string) => {
  cy.get(".bg-blue-100").should("contain", message);
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      apiLogin(email: string, password: string): Chainable<void>;
      checkToast(message: string): Chainable<void>;
      waitForLoading(): Chainable<void>;
      checkError(message: string): Chainable<void>;
      checkInfo(message: string): Chainable<void>;
    }
  }
}
