describe("Asset Management", () => {
  beforeEach(() => {
    cy.apiLogin("admin@emisify.com", "");
    cy.visit("/assets");
  });

  it("should display assets list", () => {
    cy.get('[data-testid="assets-table"]').should("exist");
    cy.get('[data-testid="asset-row"]').should("have.length.at.least", 1);
  });

  it("should create new asset", () => {
    cy.get('[data-testid="create-asset-button"]').click();
    cy.get('input[name="name"]').type("Test Asset");
    cy.get('input[name="type"]').type("Solar");
    cy.get('input[name="capacity"]').type("100");
    cy.get('input[name="location"]').type("Test Location");
    cy.get('button[type="submit"]').click();
    cy.checkToast("Asset created successfully");
  });

  it("should edit existing asset", () => {
    cy.get('[data-testid="asset-row"]').first().click();
    cy.get('[data-testid="edit-button"]').click();
    cy.get('input[name="name"]').clear().type("Updated Asset Name");
    cy.get('button[type="submit"]').click();
    cy.checkToast("Asset updated successfully");
  });

  it("should delete asset", () => {
    cy.get('[data-testid="asset-row"]').first().click();
    cy.get('[data-testid="delete-button"]').click();
    cy.get('[data-testid="confirm-delete"]').click();
    cy.checkToast("Asset deleted successfully");
  });

  it("should filter assets", () => {
    cy.get('[data-testid="filter-input"]').type("Solar");
    cy.get('[data-testid="asset-row"]').should("have.length.at.least", 1);
  });
});
