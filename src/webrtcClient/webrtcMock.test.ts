import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "../server";
import { Channel } from "../utils/channel";
import { connect, DisallowPool } from "../webrtcClient";

jest.mock("./webrtcAdapter");

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

  let a: Channel;
  let b: Channel;
  beforeEach(async () => {
    [a, b] = await Promise.all([
      connect({
        signalingServer: url,
        id: "a",
        disallow: new DisallowPool(),
        offer: "a",
        seek: "b",
      }),
      connect({
        signalingServer: url,
        id: "b",
        disallow: new DisallowPool(),
        offer: "b",
        seek: "a",
      }),
    ]);
  });

  it("finds a peer", async () => {
    a.send("test message");
    expect(await b.next()).toEqual("test message");
  });

  describe("disallow pools", () => {
    it("adds ids to the disallow pool on connection", async () => {
      const disallowPool = new DisallowPool();
      await Promise.all([
        connect({
          signalingServer: url,
          id: "alice",
          disallow: disallowPool,
          offer: "a",
          seek: "b",
        }),
        connect({
          signalingServer: url,
          id: "bob",
          disallow: new DisallowPool(),
          offer: "b",
          seek: "a",
        }),
      ]);
      expect(disallowPool.ids).toEqual(["bob"]);
    });
  });
});
