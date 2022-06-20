import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";
import { wait } from "./utils";
import { Channel, websocketChannel } from "./utils/channel";

const skipConfirmation = async (client: Channel): Promise<void> => {
  expect(await client.next()).toEqual(JSON.stringify({ success: true }));
};

jest.setTimeout(1000);

describe("runServer", () => {
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

  describe("when two peers connect", () => {
    let a: Channel;
    let b: Channel;
    beforeEach(async () => {
      a = await websocketChannel(`${url}/?offer=a&seek=a`);
      b = await websocketChannel(`${url}/?offer=a&seek=a`);
      await skipConfirmation(a);
      await skipConfirmation(b);
    });

    it("relays messages from a to b", async () => {
      a.send("test message");
      expect(await b.next()).toEqual("test message");
    });

    it("relays messages from b to a", async () => {
      b.send("test message");
      expect(await a.next()).toEqual("test message");
    });

    it("relays multiple messages in both directions", async () => {
      b.send("from b 1");
      expect(await a.next()).toEqual("from b 1");

      b.send("from b 2");
      expect(await a.next()).toEqual("from b 2");

      a.send("from a 1");
      expect(await b.next()).toEqual("from a 1");

      a.send("from a 2");
      expect(await b.next()).toEqual("from a 2");
    });
  });

  it("allows to offer and seek things by string", async () => {
    const a = await websocketChannel(`${url}?offer=a&seek=b`);
    const b = await websocketChannel(`${url}?offer=b&seek=a`);
    await skipConfirmation(a);
    await skipConfirmation(b);

    const x = await websocketChannel(`${url}?offer=x&seek=y`);
    const y = await websocketChannel(`${url}?offer=y&seek=x`);
    await skipConfirmation(x);
    await skipConfirmation(y);

    a.send("from a");
    expect(await b.next()).toEqual("from a");

    x.send("from x");
    expect(await y.next()).toEqual("from x");
  });

  it("sends an error if messages get sent before the confirmation is received", async () => {
    const a = await websocketChannel(`${url}?offer=a&seek=b`);
    a.send("foo");
    expect(await a.next()).toEqual(
      JSON.stringify({
        error: "not connected to a peer yet, please await confirmation message",
      })
    );
  });

  it("doesn't connect if b's offer doesn't match", async () => {
    const a = await websocketChannel(`${url}?offer=a&seek=b`);
    const b = await websocketChannel(`${url}?offer=foo&seek=a`);
    expect(await Promise.race([wait(200), a.next(), b.next()])).toEqual(
      undefined
    );
  });

  it("doesn't connect if a's offer doesn't match", async () => {
    const a = await websocketChannel(`${url}?offer=foo&seek=b`);
    const b = await websocketChannel(`${url}?offer=b&seek=a`);
    expect(await Promise.race([wait(200), a.next(), b.next()])).toEqual(
      undefined
    );
  });
});
