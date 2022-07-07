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
    const MyApi = {
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
    const myApi = {
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
    const aServer: ToPeer<typeof myApi> = {
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
    const bServer: ToPeer<typeof myApi> = {
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
    const aApi = {
      callA: {
        input: t.string,
        output: null,
      },
    };
    const bApi = {
      callB: {
        input: t.number,
        output: null,
      },
    };
    const aCalls: Array<string> = [];
    const aServer: ToPeer<typeof aApi> = {
      callA: (x) => {
        aCalls.push(x);
        return null;
      },
      close() {},
    };
    const bCalls: Array<number> = [];
    const bServer: ToPeer<typeof bApi> = {
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
    const aApi = {};
    const bApi = {
      double: {
        input: t.number,
        output: t.number,
      },
    };
    const aServer: ToPeer<typeof aApi> = {
      close: () => {},
    };
    const bServer: ToPeer<typeof bApi> = {
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
      const aApi = {};
      const bApi = {};
      const aServer: ToPeer<typeof aApi> = {
        close() {},
      };
      let bIsClosed = false;
      const bServer: ToPeer<typeof bApi> = {
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
      const aApi = { foo: { input: t.number, output: null } };
      const bApi = {};
      let aIsClosed = false;
      const aServer: ToPeer<typeof aApi> = {
        foo() {
          return null;
        },
        close() {
          aIsClosed = true;
        },
      };
      let bIsClosed = false;
      const bServer: ToPeer<typeof bApi> = {
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
