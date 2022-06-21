import { Api, runServer } from "./api";

describe("", () => {
  it("allows to specify an api with a single function", () => {
    const MyApi: Api = "string";
    const calls: Array<string> = [];
    const channel = runServer(MyApi, (input: string) => {
      calls.push(input);
    });
    channel.send('"foo"');
    expect(calls).toEqual(["foo"]);
  });

  it("produces type errors if the input value doesn't match", () => {
    const MyApi: Api = "string";
    // @ts-expect-error
    runServer(MyApi, (input: number) => {});
  });

  it.todo("allows to specify return values");
});
