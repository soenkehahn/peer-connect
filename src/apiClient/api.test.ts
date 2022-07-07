import { Api, handleMessages, makeServer, ToServer } from "./api";
import * as t from "./types";

describe("handleMessages", () => {
  it("allows to specify an api with a single function", async () => {
    const MyApi = {
      endpoint: {
        input: t.string,
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
    const MyApi = {
      endpoint: { input: t.string, output: null },
    };
    // @ts-expect-error
    handleMessages(MyApi, { endpoint: (input: number): null => null });
  });

  it("allows to specify return values", async () => {
    const MyApi = {
      endpoint: {
        input: t.string,
        output: t.number,
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
    const MyApi = {
      endpoint: {
        input: t.string,
        output: t.number,
      },
    };
    // @ts-expect-error
    handleMessages(MyApi, { endpoint: (input: string): string => input });
  });

  it("produces type errors if the server doesn't match the type", () => {
    const MyApi = {
      endpoint: {
        input: t.string,
        output: t.number,
      },
    };
    // @ts-expect-error
    handleMessages(MyApi, () => {});
  });

  it("allows multiple endpoints", async () => {
    const MyApi = {
      a: { input: t.string, output: t.number },
      b: { input: t.number, output: t.string },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: string): number => input.length,
      b: (n: number): string => "a".repeat(n),
    });
    expect(await handleMessage({ endpoint: "a", input: "foo" })).toEqual(3);
    expect(await handleMessage({ endpoint: "b", input: 3 })).toEqual("aaa");
  });

  it("works for async functions", async () => {
    const MyApi = {
      a: { input: t.string, output: t.number },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: string): Promise<number> => Promise.resolve(input.length),
    });
    expect(await handleMessage({ endpoint: "a", input: "foo" })).toEqual(3);
  });

  test("apis can be serialized", () => {
    const MyApi = {
      endpoint: {
        input: t.string,
        output: t.number,
      },
    };
    const api: Api = MyApi;
    expect(JSON.parse(JSON.stringify(api))).toEqual(MyApi);
  });

  test("object inputs", async () => {
    const MyApi = {
      a: { input: { s: t.string, n: t.number }, output: t.string },
    };
    const handleMessage = handleMessages(MyApi, {
      a: (input: { s: string; n: number }): string => input.s.repeat(input.n),
    });
    expect(
      await handleMessage({ endpoint: "a", input: { s: "foo", n: 3 } })
    ).toEqual("foofoofoo");
  });

  test("object outputs", async () => {
    const MyApi = {
      a: {
        input: t.string,
        output: { length: t.number, doubled: t.number },
      },
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
    const MyApi = {
      endpoint: {
        input: t.string,
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
    const myApi = {
      a: { input: t.string, output: t.number },
    };
    const server: ToServer<typeof myApi> = {
      a: (input: string) => input.length,
    };
    const serializedServer: ToServer<typeof myApi> = makeServer(
      myApi,
      handleMessages(myApi, server)
    );
    expect(await serializedServer.a("foo")).toEqual(3);
  });

  it("works for object types", async () => {
    const myApi = {
      a: {
        input: { s: t.string, n: t.number },
        output: { result: t.string, doubled: t.number },
      },
    };
    const server: ToServer<typeof myApi> = {
      a: (input: { s: string; n: number }) => ({
        result: input.s.repeat(input.n),
        doubled: input.n * 2,
      }),
    };
    const serializedServer: ToServer<typeof myApi> = makeServer(
      myApi,
      handleMessages(myApi, server)
    );
    expect(await serializedServer.a({ s: "foo", n: 3 })).toEqual({
      result: "foofoofoo",
      doubled: 6,
    });
  });
});
