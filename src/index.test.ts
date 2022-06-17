import { foo as double } from ".";

describe("double", () => {
  it("works", () => {
    expect(double(3)).toEqual(6);
  });
});
