const { _logger, _transports, tracer, Tracer, setLevel } = require("../../../../src/support/tracer");

describe("Tracer", () => {
  describe("tracer object", () => {
    function testLogLevel(level, namespace) {
      describe(`method "${level}"`, () => {
        const tracerToTest = namespace ? new Tracer(namespace) : tracer;
        const namespaceToCheck = namespace ? `[${namespace}] ` : " ";

        it(`should call to Winston logger.${level}`, () => {
          const spy = jest.spyOn(_logger, level);
          tracerToTest[level](`testing ${level}`);
          expect(spy).toHaveBeenCalledWith(`${namespaceToCheck}testing ${level}`);
        });

        it(`should format data properly when it is string`, () => {
          const spy = jest.spyOn(_logger, level);
          tracerToTest[level](`data`, "foo");
          expect(spy).toHaveBeenCalledWith(`${namespaceToCheck}data\n- foo`);
        });

        it(`should format data properly when it is number`, () => {
          const spy = jest.spyOn(_logger, level);
          tracerToTest[level](`data`, 5);
          expect(spy).toHaveBeenCalledWith(`${namespaceToCheck}data\n- 5`);
        });

        it(`should format data properly when it is an array`, () => {
          const spy = jest.spyOn(_logger, level);
          tracerToTest[level](`data`, [5, 6, "foo"]);
          expect(spy).toHaveBeenCalledWith(`${namespaceToCheck}data\n- 5\n- 6\n- foo`);
        });

        it(`should format data properly when it is an object`, () => {
          const spy = jest.spyOn(_logger, level);
          tracerToTest[level](`data`, { foo: "foo" });
          expect(spy).toHaveBeenCalledWith(`${namespaceToCheck}data\n{\n  "foo": "foo"\n}`);
        });
      });
    }

    // Check default tracer
    testLogLevel("silly");
    testLogLevel("debug");
    testLogLevel("verbose");
    testLogLevel("info");
    testLogLevel("warn");
    testLogLevel("error");

    // Check tracer with namespace
    const namespace = "Foo tracer";
    testLogLevel("silly", namespace);
    testLogLevel("debug", namespace);
    testLogLevel("verbose", namespace);
    testLogLevel("info", namespace);
    testLogLevel("warn", namespace);
    testLogLevel("error", namespace);
  });

  describe("setLevel method", () => {
    it(`should set correspondent Winston transport level`, () => {
      setLevel("debug");
      expect(_transports.console.silent).toEqual(false);
      expect(_transports.console.level).toEqual("debug");
    });

    it(`should set transport silent as true if level is silent`, () => {
      setLevel("silent");
      expect(_transports.console.silent).toEqual(true);
    });

    it(`should set silent as false when setting other level`, () => {
      setLevel("info");
      expect(_transports.console.silent).toEqual(false);
      expect(_transports.console.level).toEqual("info");
    });
  });
});
