import { WebSocketServer, WebSocket, AddressInfo } from "ws";
import {
  newQueuedMap,
  popMatch,
  pushMatch,
  QueuedMap,
} from "./utils/queued-map";

type PeerDescription = { offer: string; seek: string };

type Client = { id: string; socket: WebSocket };

export const runServer = ({
  port,
  verbose = true,
}: {
  port: number;
  verbose?: boolean;
}): Promise<WebSocketServer> => {
  const waiting: QueuedMap<PeerDescription, Client> = newQueuedMap();
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
  waiting: QueuedMap<PeerDescription, Client>,
  url: URL,
  newPeer: WebSocket
) => {
  const { id: newPeerId, description: newPeerDescription } = getParams(url);
  const match = popMatch(
    waiting,
    {
      offer: newPeerDescription.seek,
      seek: newPeerDescription.offer,
    },
    ({ id }) => id !== newPeerId
  );
  if (match) {
    connectPeers(newPeer, match.socket);
  } else {
    pushMatch(waiting, newPeerDescription, { id: newPeerId, socket: newPeer });
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

const getParams = (url: URL): { id: string; description: PeerDescription } => {
  const id = url.searchParams.get("id");
  if (!id) {
    throw new Error("id not given");
  }
  const offer = url.searchParams.get("offer");
  if (!offer) {
    throw new Error("offer not given");
  }
  const seek = url.searchParams.get("seek");
  if (!seek) {
    throw new Error("seek not given");
  }
  return { id, description: { offer, seek } };
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
