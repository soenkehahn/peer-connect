import { WebSocketServer, WebSocket, AddressInfo } from "ws";
import {
  newQueuedMap,
  popMatch,
  pushMatch,
  QueuedMap,
} from "./utils/queued-map";

type PeerDescription = { offer: string; seek: string };

export const runServer = ({
  port,
  verbose = true,
}: {
  port: number;
  verbose?: boolean;
}): Promise<WebSocketServer> => {
  const waiting: QueuedMap<PeerDescription, WebSocket> = newQueuedMap();
  const server = new WebSocketServer({ port });
  server.addListener("connection", (newPeer: WebSocket, request) => {
    if (request.url) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      switch (url.pathname) {
        case "/": {
          handleNewPeer(waiting, url, newPeer);
          break;
        }
        default: {
          throw new Error(`unknown path: ${request.url}`);
        }
      }
    }
  });
  return new Promise((resolve) => {
    server.addListener("listening", () => {
      if (verbose) {
        const port = (server.address() as AddressInfo).port;
        console.error(`listening on port ${port}...`);
      }
      resolve(server);
    });
  });
};

const handleNewPeer = (
  waiting: QueuedMap<PeerDescription, WebSocket>,
  url: URL,
  newPeer: WebSocket
) => {
  const newPeerDescription = getParams(url);
  const match = popMatch(waiting, {
    offer: newPeerDescription.seek,
    seek: newPeerDescription.offer,
  });
  if (match) {
    connectPeers(newPeer, match);
  } else {
    pushMatch(waiting, newPeerDescription, newPeer);
    newPeer.onmessage = () => {
      newPeer.send(
        JSON.stringify({
          error:
            "not connected to a peer yet, please await confirmation message",
        })
      );
    };
  }
};

const getParams = (url: URL): { offer: string; seek: string } => {
  const offer = url.searchParams.get("offer");
  const seek = url.searchParams.get("seek");
  if (!offer) {
    throw new Error("offer not given");
  }
  if (!seek) {
    throw new Error("seek not given");
  }
  return { offer, seek };
};

const connectPeers = (a: WebSocket, b: WebSocket) => {
  a.send(JSON.stringify({ success: true, color: "blue" }));
  b.send(JSON.stringify({ success: true, color: "green" }));
  a.onmessage = (event) => {
    b.send(event.data);
  };
  b.onmessage = (event) => {
    a.send(event.data);
  };
  a.onclose = () => {
    b.close();
  };
  b.onclose = () => {
    a.close();
  };
};
