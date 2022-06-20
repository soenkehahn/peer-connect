describe("hello-world example", () => {
  it("sends and receives messages", () => {
    cy.visit("http://localhost:1234");
    cy.contains("ping from a");
    cy.contains("ping from b");
  });
});
