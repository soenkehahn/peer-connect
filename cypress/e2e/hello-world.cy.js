describe("hello-world example", () => {
  it("sends and receives messages", () => {
    cy.visit("http://localhost:1234");
    cy.contains("ping from a");
    cy.contains("ping from b");
  });

  it("allows to close connections gracefully", () => {
    cy.visit("http://localhost:1234");
    cy.contains("ping from a");
    cy.contains("ping from b");
    cy.contains("button", "close a").click();
    cy.contains("a is closed");
    cy.contains("b is closed");
  });
});
