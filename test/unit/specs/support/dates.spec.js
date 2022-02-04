const { dateFromString, formatForExif, isValidDate } = require("../../../../src/support/dates");

describe("Dates format", () => {
  describe("isValidDate method", () => {
    describe("when no format is provided", () => {
      it("should return true when string is valid ISO date", () => {
        expect(isValidDate("2022-11-25")).toBe(true);
      });

      it("should return true when string is valid ISO date and time", () => {
        expect(isValidDate("2022-11-25 23:40:56")).toBe(true);
      });

      it("should return false when string is not valid ISO date", () => {
        expect(isValidDate("2022-23-25")).toBe(false);
      });

      it("should return false when string is not valid ISO date and time", () => {
        expect(isValidDate("2022-11-25 30:40:56")).toBe(false);
      });
    });

    describe("when format is provided", () => {
      it("should return true when string is valid date according to format", () => {
        expect(isValidDate("2022_11_25", "yyyy_MM_dd")).toBe(true);
      });

      it("should return false when string is not valid date according to format", () => {
        expect(isValidDate("2022-11-25", "yyyy_MM_dd")).toBe(false);
      });

      it("should return true when string is valid partial date according to format", () => {
        expect(isValidDate("11", "dd")).toBe(true);
      });
    });

    describe("when baseDate is provided", () => {
      it("should return true when string is valid partial date according to format", () => {
        expect(isValidDate("11", "dd", new Date())).toBe(true);
      });
    });
  });

  describe("dateFromString method", () => {
    describe("when no format is provided", () => {
      it("should return correspondent date when string is valid ISO date", () => {
        expect(dateFromString("2022-11-25")).toEqual(new Date(2022, 10, 25));
      });

      it("should return correspondent date and time when string is valid ISO date and time", () => {
        expect(dateFromString("1979-10-30 22:40:00")).toEqual(new Date(1979, 9, 30, 22, 40));
      });
    });

    describe("when format is provided", () => {
      it("should return correspondent date when string is valid date according to format", () => {
        expect(dateFromString("2022_11_25", "yyyy_MM_dd")).toEqual(new Date(2022, 10, 25));
      });

      it("should return correspondent date based on current date when string is valid partial date according to format", () => {
        const now = new Date();
        expect(dateFromString("11", "dd")).toEqual(
          new Date(now.getFullYear(), now.getMonth(), 11)
        );
      });
    });

    describe("when baseDate is provided", () => {
      it("should return correspondent date based on baseDate when string is valid partial date according to format", () => {
        expect(dateFromString("11", "dd", new Date(1978, 5, 15))).toEqual(new Date(1978, 5, 11));
      });
    });
  });

  describe("formatForExif method", () => {
    describe("when no format is provided", () => {
      it("should return correspondent date and time formatted for exif when string is valid ISO date", () => {
        expect(formatForExif("2022-11-25")).toEqual(`2022:11:25 00:00:00`);
      });

      it("should return correspondent date and time formatted for exif when string is valid ISO date and time", () => {
        expect(formatForExif("1979-10-30 22:40:00")).toEqual("1979:10:30 22:40:00");
      });
    });

    describe("when format is provided", () => {
      it("should return correspondent date and time formatted for exif when string is valid date according to format", () => {
        expect(formatForExif("2022_11_25", "yyyy_MM_dd")).toEqual(`2022:11:25 00:00:00`);
      });

      it("should return correspondent date formatted for exif based on current date when string is valid partial date according to format", () => {
        const now = new Date();
        expect(formatForExif("10-11", "MM-dd")).toEqual(`${now.getFullYear()}:10:11 00:00:00`);
      });
    });

    describe("when baseDate is provided", () => {
      it("should return correspondent date based on baseDate when string is valid partial date according to format", () => {
        expect(formatForExif("11", "dd", new Date(1978, 5, 15))).toEqual(`1978:06:11 00:00:00`);
      });
    });
  });
});
