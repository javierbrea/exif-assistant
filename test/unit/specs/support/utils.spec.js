const { isString, isArray, isNumber, isUndefined } = require("../../../../src/support/utils");

describe("Utils", () => {
  describe("isUndefined method", () => {
    it("should return true when value is undefined", () => {
      expect(isUndefined()).toBe(true);
    });

    it("should return false when value is a string", () => {
      expect(isUndefined("foo")).toBe(false);
    });

    it("should return false when value is a number", () => {
      expect(isUndefined(5)).toBe(false);
    });

    it("should return false when value is an Array", () => {
      expect(isUndefined(["foo"])).toBe(false);
    });

    it("should return false when value is an Object", () => {
      expect(isUndefined({ foo: "foo" })).toBe(false);
    });
  });

  describe("isString method", () => {
    it("should return true when value is string", () => {
      expect(isString("foo")).toBe(true);
    });

    it("should return false when value is undefined", () => {
      expect(isString()).toBe(false);
    });

    it("should return false when value is a number", () => {
      expect(isString(5)).toBe(false);
    });

    it("should return false when value is an Array", () => {
      expect(isString(["foo"])).toBe(false);
    });

    it("should return false when value is an Object", () => {
      expect(isString({ foo: "foo" })).toBe(false);
    });
  });

  describe("isArray method", () => {
    it("should return true when value is an Array", () => {
      expect(isArray(["foo"])).toBe(true);
    });

    it("should return false when value is undefined", () => {
      expect(isArray()).toBe(false);
    });

    it("should return false when value is a number", () => {
      expect(isArray(5)).toBe(false);
    });

    it("should return false when value is a string", () => {
      expect(isArray("foo")).toBe(false);
    });

    it("should return false when value is an Object", () => {
      expect(isArray({ foo: "foo" })).toBe(false);
    });
  });

  describe("isNumber method", () => {
    it("should return true when value is a Number", () => {
      expect(isNumber(5)).toBe(true);
    });

    it("should return false when value is undefined", () => {
      expect(isNumber()).toBe(false);
    });

    it("should return false when value is a string", () => {
      expect(isNumber("foo")).toBe(false);
    });

    it("should return false when value is an Array", () => {
      expect(isNumber(["foo"])).toBe(false);
    });

    it("should return false when value is an Object", () => {
      expect(isNumber({ foo: "foo" })).toBe(false);
    });
  });
});
