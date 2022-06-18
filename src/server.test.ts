import { AddressInfo, WebSocketServer } from "ws";
import { runServer } from "./server";

const openWebsocket = (url: string): Promise<WebSocket> => {
  const websocket = new WebSocket(url);
  return new Promise<WebSocket>((resolve) => {
    websocket.onopen = () => {
      resolve(websocket);
    };
  });
};

const nextReceived = (websocket: WebSocket): Promise<string> => {
  return new Promise<string>((resolve) => {
    websocket.onmessage = (event) => {
      resolve(event.data);
    };
  });
};

describe("runServer", () => {
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

  it("relays messages from a to b", async () => {
    const a = await openWebsocket(url);
    const b = await openWebsocket(url);
    const received = nextReceived(b);
    a.send("test message");
    expect(await received).toEqual("test message");
  });

  it("relays messages from b to a", async () => {
    const a = await openWebsocket(url);
    const b = await openWebsocket(url);
    const received = nextReceived(a);
    b.send("test message");
    expect(await received).toEqual("test message");
  });

  it("relays multiple messages in both directions", async () => {
    const a = await openWebsocket(url);
    const b = await openWebsocket(url);

    let receivedByA = nextReceived(a);
    b.send("from b 1");
    expect(await receivedByA).toEqual("from b 1");

    receivedByA = nextReceived(a);
    b.send("from b 2");
    expect(await receivedByA).toEqual("from b 2");

    let receivedByB = nextReceived(b);
    a.send("from a 1");
    expect(await receivedByB).toEqual("from a 1");

    receivedByB = nextReceived(b);
    a.send("from a 2");
    expect(await receivedByB).toEqual("from a 2");
  });
});
