import { WebSocketServer, WebSocket, MessageEvent } from "ws";

export const runServer = ({ port }: { port: number }): WebSocketServer => {
  const clients: Set<WebSocket> = new Set();
  const server = new WebSocketServer({ port });
  server.addListener("connection", (websocket: WebSocket, request) => {
    switch (request.url) {
      case "/": {
        clients.add(websocket);
        websocket.onmessage = (event: MessageEvent) => {
          for (const client of clients) {
            if (client != websocket) {
              client.send(event.data);
            }
          }
        };
        break;
      }
      default: {
        throw new Error(`unknown path: ${request.url}`);
      }
    }
  });
  return server;
};
