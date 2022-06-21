import { Api, handleMessages, parseJSON } from "./api";

describe("handleMessages", () => {
  it("allows to specify an api with a single function", async () => {
    const MyApi: { endpoint: { input: "string"; output: null } } = {
      endpoint: {
        input: "string",
        output: null,
      },
    };
    const calls: Array<string> = [];
    const handleMessage = handleMessages(MyApi, {
      endpoint: (input: string): null => {
        calls.push(input);
        return null;
      },
    });
    await handleMessage("endpoint", '"foo"');
    expect(calls).toEqual(["foo"]);
  });

  it("produces type errors if the input value doesn't match", () => {
    const MyApi: { endpoint: { input: "string"; output: null } } = {
      endpoint: { input: "string", output: null },
    };
    // @ts-expect-error
    handleMessages(MyApi, { endpoint: (input: number): null => null });
  });

  it("allows to specify return values", async () => {
    const MyApi: { endpoint: { input: "string"; output: "number" } } = {
      endpoint: {
        input: "string",
        output: "number",
      },
    };
    const handleMessage = handleMessages(MyApi, {
      endpoint: (input: string): number => input.length,
    });
    expect(JSON.parse(await handleMessage("endpoint", '"foo"'))).toEqual(3);
  });

  it("produces type errors if the output value doesn't match", () => {
    const MyApi: { endpoint: { input: "string"; output: "number" } } = {
      endpoint: {
        input: "string",
        output: "number",
      },
    };
    // @ts-expect-error
    handleMessages(MyApi, { endpoint: (input: string): string => input });
  });

  it("produces type errors if the server doesn't match the type", () => {
    const MyApi: { endpoint: { input: "string"; output: "number" } } = {
      endpoint: {
        input: "string",
        output: "number",
      },
    };
    // @ts-expect-error
    handleMessages(MyApi, () => {});
  });

  it("allows multiple endpoints", async () => {
    const MyApi: {
      a: { input: "string"; output: "number" };
      b: { input: "number"; output: "string" };
    } = {
      a: { input: "string", output: "number" },
      b: { input: "number", output: "string" },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: string): number => input.length,
      b: (n: number): string => "a".repeat(n),
    });
    expect(await handleMessage("a", '"foo"')).toEqual("3");
    expect(await handleMessage("b", "3")).toEqual('"aaa"');
  });

  it("works for async functions", async () => {
    const MyApi: {
      a: { input: "string"; output: "number" };
    } = {
      a: { input: "string", output: "number" },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: string): Promise<number> => Promise.resolve(input.length),
    });
    expect(await handleMessage("a", '"foo"')).toEqual("3");
  });

  test("apis can be serialized", () => {
    const MyApi: { endpoint: { input: "string"; output: "number" } } = {
      endpoint: {
        input: "string",
        output: "number",
      },
    };
    const api: Api = MyApi;
    expect(JSON.parse(JSON.stringify(api))).toEqual(MyApi);
  });

  test("object inputs", async () => {
    const MyApi: {
      a: { input: { s: "string"; n: "number" }; output: "string" };
    } = {
      a: { input: { s: "string", n: "number" }, output: "string" },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: { s: string; n: number }): string => input.s.repeat(input.n),
    });
    expect(await handleMessage("a", '{"s": "foo", "n": 3}')).toEqual(
      '"foofoofoo"'
    );
  });

  test("object outputs", async () => {
    const MyApi: {
      a: { input: "string"; output: { length: "number"; doubled: "number" } };
    } = {
      a: { input: "string", output: { length: "number", doubled: "number" } },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: string): { length: number; doubled: number } => ({
        length: input.length,
        doubled: input.length * 2,
      }),
    });
    expect(await handleMessage("a", '"foo"')).toEqual(
      '{"length":3,"doubled":6}'
    );
  });
});

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
        'missing field "foo" in: {}'
      );
    });

    test("invalid children", () => {
      expect(() => parseJSON({ foo: "number" }, '{"foo": "bar"}')).toThrow(
        'expected: { foo: number }, got: {"foo":"bar"}'
      );
    });
  });
});
