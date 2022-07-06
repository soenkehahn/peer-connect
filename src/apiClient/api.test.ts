import { Api, handleMessages, makeServer, ToServer } from "./api";

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
    await handleMessage({ endpoint: "endpoint", input: "foo" });
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
    expect(await handleMessage({ endpoint: "endpoint", input: "foo" })).toEqual(
      3
    );
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
    expect(await handleMessage({ endpoint: "a", input: "foo" })).toEqual(3);
    expect(await handleMessage({ endpoint: "b", input: 3 })).toEqual("aaa");
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
    expect(await handleMessage({ endpoint: "a", input: "foo" })).toEqual(3);
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
    expect(
      await handleMessage({ endpoint: "a", input: { s: "foo", n: 3 } })
    ).toEqual("foofoofoo");
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
    expect(await handleMessage({ endpoint: "a", input: "foo" })).toEqual({
      length: 3,
      doubled: 6,
    });
  });

  it("throws for invalid messages", async () => {
    const MyApi: { endpoint: { input: "string"; output: null } } = {
      endpoint: {
        input: "string",
        output: null,
      },
    };
    const handleMessage = handleMessages(MyApi, {
      endpoint: (_input: string): null => null,
    });
    await expect(
      handleMessage({ endpoint: "endpoint", input: 42 })
    ).rejects.toEqual(new Error("expected: string, got: 42"));
  });
});

describe("makeServer", () => {
  it("is the counterpart to handleMessages", async () => {
    type MyApi = {
      a: { input: "string"; output: "number" };
    };
    const myApi: MyApi = {
      a: { input: "string", output: "number" },
    };
    const server: ToServer<MyApi> = { a: (input: string) => input.length };
    const serializedServer: ToServer<MyApi> = makeServer(
      myApi,
      handleMessages(myApi, server)
    );
    expect(await serializedServer.a("foo")).toEqual(3);
  });

  it("works for object types", async () => {
    type MyApi = {
      a: {
        input: { s: "string"; n: "number" };
        output: { result: "string"; doubled: "number" };
      };
    };
    const myApi: MyApi = {
      a: {
        input: { s: "string", n: "number" },
        output: { result: "string", doubled: "number" },
      },
    };
    const server: ToServer<MyApi> = {
      a: (input: { s: string; n: number }) => ({
        result: input.s.repeat(input.n),
        doubled: input.n * 2,
      }),
    };
    const serializedServer: ToServer<MyApi> = makeServer(
      myApi,
      handleMessages(myApi, server)
    );
    expect(await serializedServer.a({ s: "foo", n: 3 })).toEqual({
      result: "foofoofoo",
      doubled: 6,
    });
  });
});
