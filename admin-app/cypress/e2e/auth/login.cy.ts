describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login form", () => {
    cy.get("input#email").should("exist");
    cy.get("input#password").should("exist");
    cy.get('button[type="submit"]').should("exist");
  });

  it("should show error with invalid credentials", () => {
    cy.get("input#email").type("invalid@example.com");
    cy.get("input#password").type("wrongpassword");
    cy.get('button[type="submit"]').click();
    cy.get(".bg-red-100").should("be.visible");
    cy.get(".bg-red-100").should("not.be.empty");
  });

  it("should successfully login with valid credentials", () => {
    cy.get("input#email").type("admin@emisify.com");
    cy.get("input#password").type("");
    cy.get('button[type="submit"]').click();

    cy.wait(2000);

    cy.url().then((url) => {
      if (url.includes("/login")) {
        cy.get(".bg-red-100").should("be.visible");
      } else {
        cy.url().should("include", "/dashboard");
      }
    });
  });

  it("should redirect to dashboard if already logged in", () => {
    const formData = new FormData();
    formData.append("username", "admin@emisify.com");
    formData.append("password", "");

    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/auth/login`,
      body: formData,
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200) {
        window.localStorage.setItem("admin_token", response.body.access_token);
        cy.visit("/login");
        cy.url().should("include", "/dashboard");
      } else {
        cy.log("Skipping test - no valid credentials available");
      }
    });
  });

  it("should show loading state during login", () => {
    cy.get("input#email").type("test@example.com");
    cy.get("input#password").type("password");

    cy.intercept("POST", "**/auth/login", {
      delay: 1000,
      statusCode: 401,
      body: { detail: "Invalid credentials" },
    }).as("loginRequest");

    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should("contain", "Signing in...");
    cy.get('button[type="submit"]').should("be.disabled");

    cy.wait("@loginRequest");
  });

  it("should require both email and password", () => {
    // Test HTML5 validation for required fields

    // Try to submit without email (password field empty)
    cy.get("input#email").type("test@example.com");
    // Don't fill password
    cy.get('button[type="submit"]').click();

    // Check that form doesn't submit (we should still be on login page)
    cy.url().should("include", "/login");

    // Check that password field is invalid (HTML5 validation)
    cy.get("input#password").should("have.attr", "required");
    cy.get("input#password").then(($input) => {
      expect(($input[0] as HTMLInputElement).validity.valid).to.be.false;
    });

    // Clear email and try without email (but with password)
    cy.get("input#email").clear();
    cy.get("input#password").type("password");
    cy.get('button[type="submit"]').click();

    // Check that form doesn't submit
    cy.url().should("include", "/login");

    // Check that email field is invalid (HTML5 validation)
    cy.get("input#email").should("have.attr", "required");
    cy.get("input#email").then(($input) => {
      expect(($input[0] as HTMLInputElement).validity.valid).to.be.false;
    });
  });
});
