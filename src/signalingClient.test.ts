import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { Channel, Colored, connect } from "./signalingClient";

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

  let a: Channel & Colored;
  let b: Channel & Colored;
  beforeEach(async () => {
    [a, b] = await Promise.all([
      connect({ url, offer: "a", seek: "b" }),
      connect({ url, offer: "b", seek: "a" }),
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
});
