const index = require("../../../src/assistant");

describe("assistant index", () => {
  describe("setDate method", () => {
    it("should exist", () => {
      expect(index.setDate).toBeDefined();
    });
  });

  describe("setDatesInFolder method", () => {
    it("should exist", () => {
      expect(index.setDatesInFolder).toBeDefined();
    });
  });
});
