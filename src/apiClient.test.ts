import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { connect } from "./apiClient";
import { ToServer } from "./api";

jest.mock("./webrtcAdapter");

jest.setTimeout(1000);

describe("apiClient", () => {
  let server: WebSocketServer;
  let url: string;

  beforeEach(async () => {
    server = await runServer({ port: 0, verbose: false });
    const port = (server.address() as AddressInfo).port;
    url = `ws://localhost:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  it("allows to find a peer by api", async () => {
    const MyApi: { sendMessage: { input: "string"; output: null } } = {
      sendMessage: { input: "string", output: null },
    };
    const aReceived: Array<string> = [];
    const aServer = {
      sendMessage: (message: string) => {
        aReceived.push(message);
        return null;
      },
    };
    const bReceived: Array<string> = [];
    const bServer = {
      sendMessage: (message: string) => {
        bReceived.push(message);
        return null;
      },
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        offer: MyApi,
        server: aServer,
        seek: MyApi,
      }),
      connect({
        signalingServer: url,
        offer: MyApi,
        server: bServer,
        seek: MyApi,
      }),
    ]);
    await a.sendMessage("from a");
    expect(bReceived).toEqual(["from a"]);
    await b.sendMessage("from b");
    expect(aReceived).toEqual(["from b"]);
  });

  test("more complex apis", async () => {
    type MyApi = {
      sendMessage: {
        input: { message: "string"; priority: "number" };
        output: { read: "string" };
      };
      announceStatus: {
        input: "string";
        output: null;
      };
    };
    const myApi: MyApi = {
      sendMessage: {
        input: { message: "string", priority: "number" },
        output: { read: "string" },
      },
      announceStatus: {
        input: "string",
        output: null,
      },
    };
    const aReceived: Array<[string, number]> = [];
    let bStatus: string = "";
    const aServer: ToServer<MyApi> = {
      sendMessage: (input: { message: string; priority: number }) => {
        aReceived.push([input.message, input.priority]);
        return { read: "read by a" };
      },
      announceStatus: (input: string) => {
        bStatus = input;
        return null;
      },
    };
    const bReceived: Array<[string, number]> = [];
    let aStatus: string = "";
    const bServer: ToServer<MyApi> = {
      sendMessage: (input: { message: string; priority: number }) => {
        bReceived.push([input.message, input.priority]);
        return { read: "read by b" };
      },
      announceStatus: (input: string) => {
        aStatus = input;
        return null;
      },
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        offer: myApi,
        server: aServer,
        seek: myApi,
      }),
      connect({
        signalingServer: url,
        offer: myApi,
        server: bServer,
        seek: myApi,
      }),
    ]);
    expect(await a.sendMessage({ message: "from a", priority: 6 })).toEqual({
      read: "read by b",
    });
    expect(bReceived).toEqual([["from a", 6]]);
    expect(await b.sendMessage({ message: "from b", priority: 3 })).toEqual({
      read: "read by a",
    });
    expect(aReceived).toEqual([["from b", 3]]);

    await a.announceStatus("a status");
    expect(aStatus).toEqual("a status");
    await b.announceStatus("b status");
    expect(bStatus).toEqual("b status");
  });

  test("asymmetric apis", async () => {
    type AApi = {
      callA: {
        input: "string";
        output: null;
      };
    };
    const aApi: AApi = {
      callA: {
        input: "string",
        output: null,
      },
    };
    type BApi = {
      callB: {
        input: "number";
        output: null;
      };
    };
    const bApi: BApi = {
      callB: {
        input: "number",
        output: null,
      },
    };
    const aCalls: Array<string> = [];
    const aServer: ToServer<AApi> = {
      callA: (x) => {
        aCalls.push(x);
        return null;
      },
    };
    const bCalls: Array<number> = [];
    const bServer: ToServer<BApi> = {
      callB: (x) => {
        bCalls.push(x);
        return null;
      },
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        offer: aApi,
        server: aServer,
        seek: bApi,
      }),
      connect({
        signalingServer: url,
        offer: bApi,
        server: bServer,
        seek: aApi,
      }),
    ]);
    await a.callB(42);
    expect(bCalls).toEqual([42]);
    await b.callA("foo");
    expect(aCalls).toEqual(["foo"]);
  });

  it("works for concurrent requests", async () => {
    type AApi = {};
    const aApi: AApi = {};
    type BApi = {
      double: {
        input: "number";
        output: "number";
      };
    };
    const bApi: BApi = {
      double: {
        input: "number",
        output: "number",
      },
    };
    const aServer: ToServer<AApi> = {};
    const bServer: ToServer<BApi> = {
      double: (x) => x * 2,
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        offer: aApi,
        server: aServer,
        seek: bApi,
      }),
      connect({
        signalingServer: url,
        offer: bApi,
        server: bServer,
        seek: aApi,
      }),
    ]);
    const results = await Promise.all([1, 2, 3, 4, 5].map((i) => a.double(i)));
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });
});
