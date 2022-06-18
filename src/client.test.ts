import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { connect } from "./client";

describe("offer & seek", () => {
  let server: WebSocketServer;
  let url: string;

  beforeEach(() => {
    server = runServer({ port: 0 });
    const port = (server.address() as AddressInfo).port;
    url = `ws://localhost:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  it("finds a peer", async () => {
    const a = await connect(url);
    const b = await connect(url);
    a.send("test message");
    expect(await b.nextReceived).toEqual("test message");
  });

  it("allows to send multiple messages to the peer", async () => {
    const a = await connect(url);
    const b = await connect(url);
    a.send("test message 1");
    expect(await b.nextReceived).toEqual("test message 1");
    a.send("test message 2");
    expect(await b.nextReceived).toEqual("test message 2");
  });

  it("allows to send multiple messages the other direction", async () => {
    const a = await connect(url);
    const b = await connect(url);
    b.send("test message 1");
    expect(await a.nextReceived).toEqual("test message 1");
    b.send("test message 2");
    expect(await a.nextReceived).toEqual("test message 2");
  });
});
