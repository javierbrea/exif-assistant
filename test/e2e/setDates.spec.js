const { cli } = require("../support/runner");

describe("Index file", () => {
  describe("run method", () => {
    it("should exist", async () => {
      const cliResult = await cli(["set-dates", ".", "--outputFolder", "./testing"]);
      console.log(cliResult);
      expect(cliResult.code).toEqual(0);
    });
  });
});
