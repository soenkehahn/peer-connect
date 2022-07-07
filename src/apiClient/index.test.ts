import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "../server";
import { expectToHang, waitFor } from "../utils";
import { connect, ToPeer } from ".";
import * as t from "./types";

jest.mock("../webrtcClient/webrtcAdapter");

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
    const MyApi: { sendMessage: { input: t.stringType; output: null } } = {
      sendMessage: { input: t.string, output: null },
    };
    const aReceived: Array<string> = [];
    const aServer = {
      sendMessage: (message: string) => {
        aReceived.push(message);
        return null;
      },
      close() {},
    };
    const bReceived: Array<string> = [];
    const bServer = {
      sendMessage: (message: string) => {
        bReceived.push(message);
        return null;
      },
      close() {},
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        id: "a",
        offer: MyApi,
        server: aServer,
        seek: MyApi,
      }),
      connect({
        signalingServer: url,
        id: "b",
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
        input: { message: t.stringType; priority: t.numberType };
        output: { read: t.stringType };
      };
      announceStatus: {
        input: t.stringType;
        output: null;
      };
    };
    const myApi: MyApi = {
      sendMessage: {
        input: { message: t.string, priority: t.number },
        output: { read: t.string },
      },
      announceStatus: {
        input: t.string,
        output: null,
      },
    };
    const aReceived: Array<[string, number]> = [];
    let bStatus: string = "";
    const aServer: ToPeer<MyApi> = {
      sendMessage: (input: { message: string; priority: number }) => {
        aReceived.push([input.message, input.priority]);
        return { read: "read by a" };
      },
      announceStatus: (input: string) => {
        bStatus = input;
        return null;
      },
      close() {},
    };
    const bReceived: Array<[string, number]> = [];
    let aStatus: string = "";
    const bServer: ToPeer<MyApi> = {
      sendMessage: (input: { message: string; priority: number }) => {
        bReceived.push([input.message, input.priority]);
        return { read: "read by b" };
      },
      announceStatus: (input: string) => {
        aStatus = input;
        return null;
      },
      close() {},
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        id: "a",
        offer: myApi,
        server: aServer,
        seek: myApi,
      }),
      connect({
        signalingServer: url,
        id: "b",
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
        input: t.stringType;
        output: null;
      };
    };
    const aApi: AApi = {
      callA: {
        input: t.string,
        output: null,
      },
    };
    type BApi = {
      callB: {
        input: t.numberType;
        output: null;
      };
    };
    const bApi: BApi = {
      callB: {
        input: t.number,
        output: null,
      },
    };
    const aCalls: Array<string> = [];
    const aServer: ToPeer<AApi> = {
      callA: (x) => {
        aCalls.push(x);
        return null;
      },
      close() {},
    };
    const bCalls: Array<number> = [];
    const bServer: ToPeer<BApi> = {
      callB: (x) => {
        bCalls.push(x);
        return null;
      },
      close() {},
    };
    const [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        id: "a",
        offer: aApi,
        server: aServer,
        seek: bApi,
      }),
      connect({
        signalingServer: url,
        id: "b",
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
        input: t.numberType;
        output: t.numberType;
      };
    };
    const bApi: BApi = {
      double: {
        input: t.number,
        output: t.number,
      },
    };
    const aServer: ToPeer<AApi> = {
      close: () => {},
    };
    const bServer: ToPeer<BApi> = {
      double: (x) => x * 2,
      close() {},
    };
    const [a, _b] = await Promise.all([
      connect({
        signalingServer: url,
        id: "a",
        offer: aApi,
        server: aServer,
        seek: bApi,
      }),
      connect({
        signalingServer: url,
        id: "b",
        offer: bApi,
        server: bServer,
        seek: aApi,
      }),
    ]);
    const results = await Promise.all([1, 2, 3, 4, 5].map((i) => a.double(i)));
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("allows to disallow other ids", async () => {
    const api = { disallowApi: { input: null, output: null } };
    const server = (): ToPeer<typeof api> => ({
      disallowApi(_) {
        return null;
      },
      close() {},
    });
    await expectToHang(500, [
      connect({
        signalingServer: url,
        id: "a",
        disallow: ["b"],
        offer: api,
        server: server(),
        seek: api,
      }),
      connect({
        signalingServer: url,
        id: "b",
        offer: api,
        server: server(),
        seek: api,
      }),
    ]);
  });

  describe("closing", () => {
    it("relays closing the connection", async () => {
      type AApi = {};
      const aApi: AApi = {};
      type BApi = {};
      const bApi: BApi = {};
      const aServer: ToPeer<AApi> = {
        close() {},
      };
      let bIsClosed = false;
      const bServer: ToPeer<BApi> = {
        close: () => (bIsClosed = true),
      };
      const [a, _b] = await Promise.all([
        connect({
          signalingServer: url,
          id: "a",
          offer: aApi,
          server: aServer,
          seek: bApi,
        }),
        connect({
          signalingServer: url,
          id: "b",
          offer: bApi,
          server: bServer,
          seek: aApi,
        }),
      ]);
      a.close();
      await waitFor(500, () => expect(bIsClosed).toEqual(true));
    });

    it("errors when trying to call a function on a remote closed peer", async () => {
      type AApi = { foo: { input: t.numberType; output: null } };
      const aApi: AApi = { foo: { input: t.number, output: null } };
      type BApi = {};
      const bApi: BApi = {};
      let aIsClosed = false;
      const aServer: ToPeer<AApi> = {
        foo() {
          return null;
        },
        close() {
          aIsClosed = true;
        },
      };
      let bIsClosed = false;
      const bServer: ToPeer<BApi> = {
        close: () => (bIsClosed = true),
      };
      const [a, _b] = await Promise.all([
        connect({
          signalingServer: url,
          id: "b",
          offer: bApi,
          server: bServer,
          seek: aApi,
        }),
        connect({
          signalingServer: url,
          id: "a",
          offer: aApi,
          server: aServer,
          seek: bApi,
        }),
      ]);
      a.close();
      await waitFor(500, () => expect(aIsClosed).toEqual(true));
      await waitFor(500, () => expect(bIsClosed).toEqual(true));
      await expect(a.foo(42)).rejects.toEqual(
        new Error("cannot send: peer is closed")
      );
    });
  });
});
