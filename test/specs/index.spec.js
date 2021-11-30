const index = require("../../src/index");

describe("Index file", () => {
  it("should not export anything", () => {
    expect(index).toEqual({});
  });
});
