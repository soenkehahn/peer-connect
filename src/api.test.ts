import { Api, handleMessages } from "./api";

describe("handleMessages", () => {
  it("allows to specify an api with a single function", () => {
    const MyApi: { input: "string"; output: null } = {
      input: "string",
      output: null,
    };
    const calls: Array<string> = [];
    const handleMessage = handleMessages(MyApi, (input: string): null => {
      calls.push(input);
      return null;
    });
    handleMessage('"foo"');
    expect(calls).toEqual(["foo"]);
  });

  it("produces type errors if the input value doesn't match", () => {
    const MyApi: Api = { input: "string", output: null };
    // @ts-expect-error
    handleMessages(MyApi, (input: number) => {});
  });

  it("allows to specify return values", () => {
    const MyApi: { input: "string"; output: "number" } = {
      input: "string",
      output: "number",
    };
    const handleMessage = handleMessages(
      MyApi,
      (input: string): number => input.length
    );
    expect(JSON.parse(handleMessage('"foo"'))).toEqual(3);
  });

  it("produces type errors if the output value doesn't match", () => {
    const MyApi: { input: "string"; output: "number" } = {
      input: "string",
      output: "number",
    };
    // @ts-expect-error
    handleMessages(MyApi, (input: string): string => input);
  });

  test("apis can be serialized", () => {
    const MyApi: { input: "string"; output: "number" } = {
      input: "string",
      output: "number",
    };
    expect(JSON.parse(JSON.stringify(MyApi))).toEqual(MyApi);
  });
});
