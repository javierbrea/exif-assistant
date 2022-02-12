const path = require("path");
const { shortPath } = require("../../../src/reports/tableFormats");

describe("tableFormats", () => {
  describe("shortPath", () => {
    it("should return . if it is an empty string", () => {
      expect(shortPath("")).toEqual(".");
    });

    it("should not add current path prefix if it starts with ../", () => {
      expect(shortPath(`..${path.sep}foo`)).toEqual(`..${path.sep}foo`);
    });

    it("should not add current path prefix if it starts with ./", () => {
      expect(shortPath(`.${path.sep}foo`)).toEqual(`.${path.sep}foo`);
    });

    it("should add current path prefix if it starts with .", () => {
      expect(shortPath(".foo")).toEqual(`.${path.sep}.foo`);
    });

    it("should add current path prefix if it starts with any other character", () => {
      expect(shortPath("foo")).toEqual(`.${path.sep}foo`);
    });

    it("should make path shorter when it starts by ./", () => {
      expect(shortPath(`.${path.sep}foo/var/foo/varfoo/foo/foo/foo/var.jpg`)).toEqual(
        `.${path.sep}foo/[...]oo/foo/foo/var.jpg`
      );
    });

    it("should make path shorter when it starts by ../", () => {
      expect(shortPath(`..${path.sep}foo/var/foo/varfoo/foo/foo/foo/var.jpg`)).toEqual(
        `..${path.sep}foo[...]oo/foo/foo/var.jpg`
      );
    });

    it("should make path shorter when it starts by any other character", () => {
      expect(shortPath("foo/var/foo/varfoo/foo/foo/foo/var.jpg")).toEqual(
        `.${path.sep}foo/[...]oo/foo/foo/var.jpg`
      );
    });
  });
});
