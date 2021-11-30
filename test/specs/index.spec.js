const { tracer } = require("../../src/support/tracer");
const index = require("../../src/index");

describe("Index file", () => {
  describe("start method", () => {
    it("should tracer Hello world", () => {
      const spy = jest.spyOn(tracer, "info");
      index.start();
      expect(spy).toHaveBeenCalledWith("Hello world!");
      spy.mockRestore();
    });
  });
});
