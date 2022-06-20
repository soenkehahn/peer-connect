describe("hello-world example", () => {
  it("sends and receives messages", () => {
    cy.visit("http://localhost:1234");
    cy.contains("ping from initiator");
    cy.contains("ping from joiner");
  });
});
