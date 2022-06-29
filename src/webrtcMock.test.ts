import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { Channel } from "./utils/channel";
import { connect } from "./webrtcClient";

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
        disallow: [],
        offer: "a",
        seek: "b",
      }),
      connect({
        signalingServer: url,
        id: "b",
        disallow: [],
        offer: "b",
        seek: "a",
      }),
    ]);
  });

  it("finds a peer", async () => {
    a.send("test message");
    expect(await b.next()).toEqual("test message");
  });
});
