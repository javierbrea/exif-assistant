const { disableWarn, restoreWarn } = require("../../../src/support/console");
const { _logger } = require("../../../src/support/tracer");

describe("Console", () => {
  describe("disableWarn", () => {
    it("should replace console by a call to tracer.silly", () => {
      const spy = jest.spyOn(_logger, "silly");
      disableWarn();
      console.warn("foo");
      expect(spy).toHaveBeenCalledWith("[console] foo");
    });

    it("should be able to be called many times without error", () => {
      const spy = jest.spyOn(_logger, "silly");
      disableWarn();
      disableWarn();
      disableWarn();
      disableWarn();
      console.warn("foo");
      expect(spy).toHaveBeenCalledWith("[console] foo");
    });
  });

  describe("restoreWarn", () => {
    it("should restore console.warn", () => {
      const spy = jest.spyOn(_logger, "silly");
      restoreWarn();
      console.warn("foo");
      expect(spy).not.toHaveBeenCalled();
    });

    it("should be able to be called many times without error", () => {
      const spy = jest.spyOn(_logger, "silly");
      restoreWarn();
      restoreWarn();
      restoreWarn();
      restoreWarn();
      console.warn("foo");
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
