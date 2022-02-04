const index = require("../../../src/index");

describe("Index file", () => {
  describe("run method", () => {
    it("should exist", () => {
      expect(index.run).toBeDefined();
    });
  });
});
