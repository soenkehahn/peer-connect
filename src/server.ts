import { WebSocketServer, WebSocket, MessageEvent } from "ws";

export const runServer = ({ port }: { port: number }): WebSocketServer => {
  const clients: {
    [offer: string]: Array<{ seek: string; client: WebSocket }>;
  } = {};
  const server = new WebSocketServer({ port });
  server.addListener("connection", (websocket: WebSocket, request) => {
    if (request.url) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      switch (url.pathname) {
        case "/": {
          const offer = url.searchParams.get("offer");
          const seek = url.searchParams.get("seek");
          if (!offer) {
            throw new Error("offer not given");
          }
          if (!seek) {
            throw new Error("seek not given");
          }

          if (!clients[offer]) {
            clients[offer] = [];
          }
          clients[offer].push({ client: websocket, seek });
          websocket.onmessage = (event: MessageEvent) => {
            const peers = clients[seek];
            for (const peer of peers) {
              if (peer.client != websocket) {
                peer.client.send(event.data);
              }
            }
          };
          break;
        }
        default: {
          throw new Error(`unknown path: ${request.url}`);
        }
      }
    }
  });
  return server;
};
