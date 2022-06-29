import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { connect, HasColor } from "./signalingClient";
import { waitFor } from "./utils";
import { Channel } from "./utils/channel";

jest.setTimeout(1000);

describe("offer & seek", () => {
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

  let a: Channel & HasColor;
  let b: Channel & HasColor;
  beforeEach(async () => {
    [a, b] = await Promise.all([
      connect({ url, id: "a", disallow: [], offer: "a", seek: "b" }),
      connect({ url, id: "b", disallow: [], offer: "b", seek: "a" }),
    ]);
  });

  it("finds a peer", async () => {
    a.send("test message");
    expect(await b.next()).toEqual("test message");
  });

  it("allows to send multiple messages to the peer", async () => {
    a.send("test message 1");
    expect(await b.next()).toEqual("test message 1");
    a.send("test message 2");
    expect(await b.next()).toEqual("test message 2");
  });

  it("allows to send multiple messages the other direction", async () => {
    b.send("test message 1");
    expect(await a.next()).toEqual("test message 1");
    b.send("test message 2");
    expect(await a.next()).toEqual("test message 2");
  });

  it("marks one peer as blue and the other as green", async () => {
    expect(new Set([a.color, b.color])).toEqual(new Set(["blue", "green"]));
  });

  describe("closing channels", () => {
    it("relays closing to peers", async () => {
      let bIsClosed = false;
      b.onclose = () => (bIsClosed = true);
      a.close();
      await waitFor(500, () => expect(bIsClosed).toEqual(true));
    });

    it("relays closing to peers in the other direction", async () => {
      let aIsClosed = false;
      a.onclose = () => (aIsClosed = true);
      b.close();
      await waitFor(500, () => expect(aIsClosed).toEqual(true));
    });

    describe("next yields null when the server is closed", () => {
      const tests: Array<() => Promise<void>> = [
        async () => {
          a.close();
          expect(await a.next()).toEqual(null);
        },
        async () => {
          a.close();
          expect(await b.next()).toEqual(null);
        },
        async () => {
          a.close();
          expect(await b.next()).toEqual(null);
          expect(await a.next()).toEqual(null);
        },
        async () => {
          const promise = a.next();
          a.close();
          expect(await promise).toEqual(null);
        },
        async () => {
          const promise = b.next();
          a.close();
          expect(await promise).toEqual(null);
        },
      ];
      tests.forEach((action, i) => {
        test(`scenario ${i + 1}`, action);
      });
    });
  });
});
