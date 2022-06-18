describe("App", () => {
  it("shows 'hello world'", () => {
    cy.visit("http://localhost:1234");
    cy.contains("hello world");
  });
});
