import { parseJSON, ToType } from "./types";
import * as t from "./types";

describe("parseJSON", () => {
  it("throws errors for invalid json", () => {
    expect(() => parseJSON(t.string, "{")).toThrow(
      "Unexpected end of JSON input"
    );
  });

  describe("strings", () => {
    test("valid strings", () => {
      expect(parseJSON(t.string, '"foo"')).toEqual("foo");
    });

    test("invalid strings", () => {
      expect(() => parseJSON(t.string, "42")).toThrow(
        "expected: string, got: 42"
      );
    });
  });

  describe("numbers", () => {
    test("valid numbers", () => {
      expect(parseJSON(t.number, "42")).toEqual(42);
    });

    test("invalid numbers", () => {
      expect(() => parseJSON(t.number, '"foo"')).toThrow(
        'expected: number, got: "foo"'
      );
    });
  });

  describe("booleans", () => {
    test("valid booleans", () => {
      expect(parseJSON(t.boolean, "true")).toEqual(true);
      expect(parseJSON(t.boolean, "false")).toEqual(false);
    });

    test("invalid booleans", () => {
      expect(() => parseJSON(t.boolean, '"foo"')).toThrow(
        'expected: boolean, got: "foo"'
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
      expect(parseJSON({ foo: t.number }, '{"foo": 42}')).toEqual({ foo: 42 });
    });

    test("invalid objects", () => {
      expect(() => parseJSON({ foo: t.number }, '"foo"')).toThrow(
        'expected: { foo: number }, got: "foo"'
      );
    });

    test("invalid objects with multiple fields", () => {
      expect(() =>
        parseJSON({ foo: t.number, bar: t.string }, '"foo"')
      ).toThrow('expected: { foo: number, bar: string }, got: "foo"');
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
        parseJSON({ foo: { bar: t.number } }, '{"foo": {"bar": 42}}')
      ).toEqual({ foo: { bar: 42 } });
    });

    test("missing fields", () => {
      expect(() => parseJSON({ foo: t.number }, "{}")).toThrow(
        "expected: { foo: number }, got: {}"
      );
    });

    test("invalid children", () => {
      expect(() => parseJSON({ foo: t.number }, '{"foo": "bar"}')).toThrow(
        'expected: { foo: number }, got: {"foo":"bar"}'
      );
    });

    test("object fields can have different union types", () => {
      const typ = {
        x: t.union(t.literal("foo"), t.literal("bar")),
        y: t.union(t.literal("a"), t.literal("b")),
      };
      const ts: Array<ToType<typeof typ>> = [
        { x: "foo", y: "a" },
        { x: "bar", y: "b" },
        { x: "foo", y: "b" },
      ];
      ts;
    });

    it("propagates parameterized types to field types correctly", () => {
      const typ = {
        x: t.union(t.literal("foo"), t.literal("bar")),
        y: t.union(t.literal("a"), t.literal("b")),
      };
      const x: ToType<typeof typ> = { x: "foo", y: "a" };
      type Typ = {
        x: "foo" | "bar";
        y: "a" | "b";
      };
      const y: Typ = x;
      y;

      // @ts-expect-error
      const z: ToType<typeof typ> = { x: "foo", y: "foo" };
      z;
    });
  });

  describe("literal string types", () => {
    it("allows string literals as types", () => {
      expect(parseJSON(t.literal("foo"), '"foo"')).toEqual("foo");
      expect(() => parseJSON(t.literal("foo"), '"bar"')).toThrow(
        'expected: "foo", got: "bar"'
      );
      expect(() => parseJSON(t.literal("foo"), "true")).toThrow(
        'expected: "foo", got: true'
      );
    });
  });

  describe("unions", () => {
    it("allows unions of two string literals", () => {
      const union = t.union(t.literal("foo"), t.literal("bar"));
      expect(parseJSON(union, '"foo"')).toEqual("foo");
      expect(parseJSON(union, '"bar"')).toEqual("bar");
      expect(() => parseJSON(union, '"baz"')).toThrow(
        'expected: "foo" | "bar", got: "baz"'
      );
      expect(() => parseJSON(union, "42")).toThrow(
        'expected: "foo" | "bar", got: 42'
      );
    });

    it("allows unions of more than two string literals", () => {
      const union = t.union(
        t.literal("foo"),
        t.union(t.literal("bar"), t.literal("baz"))
      );
      expect(parseJSON(union, '"foo"')).toEqual("foo");
      expect(parseJSON(union, '"bar"')).toEqual("bar");
      expect(parseJSON(union, '"baz"')).toEqual("baz");
      expect(() => parseJSON(union, '"invalid"')).toThrow(
        'expected: "foo" | "bar" | "baz", got: "invalid"'
      );
      expect(() => parseJSON(union, "42")).toThrow(
        'expected: "foo" | "bar" | "baz", got: 42'
      );
    });

    test("unions work with TypeOf", () => {
      const typ = t.union(t.literal("foo"), t.literal("bar"));
      const ts: Array<ToType<typeof typ>> = ["foo", "bar"];
      ts;
    });
  });
});
