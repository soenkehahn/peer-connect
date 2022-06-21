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
    it("valid numbers", () => {
      expect(parseJSON("number", "42")).toEqual(42);
    });

    test("invalid numbers", () => {
      expect(() => parseJSON("number", '"foo"')).toThrow(
        'expected: number, got: "foo"'
      );
    });
  });

  describe("null", () => {
    it("valid null", () => {
      expect(parseJSON(null, "null")).toEqual(null);
    });

    test("invalid null", () => {
      expect(() => parseJSON(null, '"foo"')).toThrow(
        'expected: null, got: "foo"'
      );
    });
  });
});
