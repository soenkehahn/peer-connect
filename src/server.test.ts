import { AddressInfo } from "ws";
import { runServer } from "./server";

const openWebsocket = (url: string): Promise<WebSocket> => {
  const websocket = new WebSocket(url);
  return new Promise<WebSocket>((resolve) => {
    websocket.onopen = () => {
      resolve(websocket);
    };
  });
};

const nextMessage = (websocket: WebSocket): Promise<string> => {
  return new Promise<string>((resolve) => {
    websocket.onmessage = (event) => {
      resolve(event.data);
    };
  });
};

describe("runServer", () => {
  it("relays messages from seeker to offerer", async () => {
    const server = runServer({ port: 0 });
    const port = (server.address() as AddressInfo).port;
    const offeringWebsocket = await openWebsocket(
      `ws://localhost:${port}/offer`
    );
    const messagePromise = nextMessage(offeringWebsocket);
    const seekingWebsocket = await openWebsocket(`ws://localhost:${port}/seek`);
    seekingWebsocket.send("test message");
    expect(await messagePromise).toEqual("test message");
    server.close();
  });
});
