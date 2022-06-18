import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { offer, seek } from "./client";

describe("offer & seek", () => {
  let server: WebSocketServer;
  let baseUrl: string;

  beforeEach(() => {
    server = runServer({ port: 0 });
    const port = (server.address() as AddressInfo).port;
    baseUrl = `ws://localhost:${port}`;
  });

  afterEach(() => {
    server.close();
  });

  it("finds an offer", async () => {
    const offerer = await offer(`${baseUrl}/offer`);
    const seeker = await seek(`${baseUrl}/seek`);
    seeker.send("test message");
    expect(await offerer.nextMessage).toEqual("test message");
  });

  it("allows to send multiple messages to the seeker", async () => {
    const offerer = await offer(`${baseUrl}/offer`);
    const seeker = await seek(`${baseUrl}/seek`);
    seeker.send("test message 1");
    expect(await offerer.nextMessage).toEqual("test message 1");
    seeker.send("test message 2");
    expect(await offerer.nextMessage).toEqual("test message 2");
  });
});
