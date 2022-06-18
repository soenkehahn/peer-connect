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

const nextMessage = (websocket: WebSocket): Promise<string> => {
  return new Promise<string>((resolve) => {
    websocket.onmessage = (event) => {
      resolve(event.data);
    };
  });
};

describe("runServer", () => {
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

  it("relays messages from seeker to offerer", async () => {
    const offeringWebsocket = await openWebsocket(`${baseUrl}/offer`);
    const messagePromise = nextMessage(offeringWebsocket);
    const seekingWebsocket = await openWebsocket(`${baseUrl}/seek`);
    seekingWebsocket.send("test message");
    expect(await messagePromise).toEqual("test message");
  });

  it("relays messages from offerer to seeker", async () => {
    const offeringWebsocket = await openWebsocket(`${baseUrl}/offer`);
    const seekingWebsocket = await openWebsocket(`${baseUrl}/seek`);
    const messagePromise = nextMessage(seekingWebsocket);
    offeringWebsocket.send("test message");
    expect(await messagePromise).toEqual("test message");
  });

  it("relays multiple messages in both directions", async () => {
    const offeringWebsocket = await openWebsocket(`${baseUrl}/offer`);
    const seekingWebsocket = await openWebsocket(`${baseUrl}/seek`);

    let receivedByOfferer = nextMessage(offeringWebsocket);
    seekingWebsocket.send("from seeker 1");
    expect(await receivedByOfferer).toEqual("from seeker 1");

    receivedByOfferer = nextMessage(offeringWebsocket);
    seekingWebsocket.send("from seeker 2");
    expect(await receivedByOfferer).toEqual("from seeker 2");

    let receivedBySeeker = nextMessage(seekingWebsocket);
    offeringWebsocket.send("from offerer 1");
    expect(await receivedBySeeker).toEqual("from offerer 1");

    receivedBySeeker = nextMessage(seekingWebsocket);
    offeringWebsocket.send("from offerer 2");
    expect(await receivedBySeeker).toEqual("from offerer 2");
  });
});
