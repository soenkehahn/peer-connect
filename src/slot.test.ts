import { AddressInfo, WebSocketServer } from "ws";
import { connect, ToPeer } from "./apiClient";
import { runServer } from "./server";
import { newSlot } from "./slot";
import { expectToHang, waitFor } from "./utils";

jest.mock("./webrtcClient/webrtcAdapter");

jest.setTimeout(1000);

const sendApi = { send: { input: "string", output: null } } as const;

const emptyApi = {} as const;

describe("newSlot", () => {
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

  it("provides a peer to call methods on", async () => {
    const receivedByBob: Array<string> = [];
    connect({
      signalingServer: url,
      id: "bob",
      offer: sendApi,
      server: {
        send(message: string): null {
          receivedByBob.push(message);
          return null;
        },
        close() {},
      },
      seek: emptyApi,
    });
    newSlot({
      signalingServer: url,
      id: "alice",
      offer: emptyApi,
      handler: { close() {} },
      seek: sendApi,
      handlePeer: (bob) => {
        bob.send("foo");
      },
    });
    await waitFor(500, () => {
      expect(receivedByBob).toEqual(["foo"]);
    });
  });

  it("relay method calls from the peer to the given server", async () => {
    connect({
      signalingServer: url,
      id: "bob",
      offer: emptyApi,
      server: {
        close() {},
      },
      seek: sendApi,
    }).then((bob) => bob.send("foo"));
    const receivedByAlice: Array<string> = [];
    newSlot({
      signalingServer: url,
      id: "alice",
      offer: sendApi,
      handler: {
        send(message: string) {
          receivedByAlice.push(message);
          return null;
        },
        close() {},
      },
      seek: emptyApi,
      handlePeer: () => {},
    });
    await waitFor(500, () => {
      expect(receivedByAlice).toEqual(["foo"]);
    });
  });

  it("notifies when the peer is connected", async () => {
    const slot = newSlot({
      signalingServer: url,
      id: "alice",
      offer: emptyApi,
      handler: {
        close() {},
      },
      seek: emptyApi,
      handlePeer: () => {},
    });
    await expectToHang(200, [slot.connected]);
    connect({
      signalingServer: url,
      id: "bob",
      offer: emptyApi,
      server: {
        close() {},
      },
      seek: emptyApi,
    });
    await slot.connected;
  });

  it("tries to reestablish the connection when it closes", async () => {
    let connectionCounter = 0;
    newSlot({
      signalingServer: url,
      id: "alice",
      offer: sendApi,
      handler: {
        send() {
          return null;
        },
        close() {},
      },
      seek: sendApi,
      handlePeer: (bob) => {
        connectionCounter++;
        bob.send(`connection ${connectionCounter}`);
      },
    });

    const receivedByBob: Array<string> = [];
    const spawnBob = (): Promise<ToPeer<typeof sendApi>> =>
      connect({
        signalingServer: url,
        id: "bob",
        offer: sendApi,
        server: {
          send(message: string) {
            receivedByBob.push(message);
            return null;
          },
          close() {},
        },
        seek: sendApi,
      });
    const bob = spawnBob();
    await waitFor(200, () => expect(receivedByBob).toEqual(["connection 1"]));

    (await bob).close();
    spawnBob();
    await waitFor(200, () =>
      expect(receivedByBob).toEqual(["connection 1", "connection 2"])
    );
  });
});
