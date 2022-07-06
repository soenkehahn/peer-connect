import { parseJSON } from "./types";

describe("parseJSON", () => {
  it("throws errors for invalid json", () => {
    expect(() => parseJSON("string", "{")).toThrow(
      "Unexpected end of JSON input"
    );
  });

  describe("strings", () => {
    test("valid strings", () => {
      expect(parseJSON("string", '"foo"')).toEqual("foo");
    });

    test("invalid strings", () => {
      expect(() => parseJSON("string", "42")).toThrow(
        "expected: string, got: 42"
      );
    });
  });

  describe("numbers", () => {
    test("valid numbers", () => {
      expect(parseJSON("number", "42")).toEqual(42);
    });

    test("invalid numbers", () => {
      expect(() => parseJSON("number", '"foo"')).toThrow(
        'expected: number, got: "foo"'
      );
    });
  });

  describe("null", () => {
    test("valid null", () => {
      expect(parseJSON(null, "null")).toEqual(null);
    });

    test("invalid null", () => {
      expect(() => parseJSON(null, '"foo"')).toThrow(
        'expected: null, got: "foo"'
      );
    });
  });

  describe("objects", () => {
    test("valid objects", () => {
      expect(parseJSON({ foo: "number" }, '{"foo": 42}')).toEqual({ foo: 42 });
    });

    test("invalid object", () => {
      expect(() => parseJSON({ foo: "number" }, '"foo"')).toThrow(
        'expected: { foo: number }, got: "foo"'
      );
    });

    it("ignores additional fields", () => {
      expect(parseJSON({}, '{"foo": 42}')).toEqual({ foo: 42 });
    });

    test("empty object", () => {
      expect(parseJSON({}, "{}")).toEqual({});
      expect(() => parseJSON({}, '"foo"')).toThrow('expected: {}, got: "foo"');
    });

    it("nested objects", () => {
      expect(
        parseJSON({ foo: { bar: "number" } }, '{"foo": {"bar": 42}}')
      ).toEqual({ foo: { bar: 42 } });
    });

    test("missing fields", () => {
      expect(() => parseJSON({ foo: "number" }, "{}")).toThrow(
        "expected: { foo: number }, got: {}"
      );
    });

    test("invalid children", () => {
      expect(() => parseJSON({ foo: "number" }, '{"foo": "bar"}')).toThrow(
        'expected: { foo: number }, got: {"foo":"bar"}'
      );
    });
  });
});
