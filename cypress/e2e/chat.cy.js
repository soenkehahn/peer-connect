describe("App", () => {
  it("relays chat messages", () => {
    cy.visit("http://localhost:1234");
    cy.contains("ping from initiator");
    cy.contains("ping from joiner");
  });
});
