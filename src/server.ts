import { WebSocketServer, WebSocket, MessageEvent } from "ws";
let offerer: null | WebSocket = null;

export const runServer = ({ port }: { port: number }): WebSocketServer => {
  const server = new WebSocketServer({ port });
  server.addListener("connection", (websocket: WebSocket, request) => {
    switch (request.url) {
      case "/offer": {
        offer(websocket);
        break;
      }
      case "/seek": {
        seek(websocket);
        break;
      }
      default: {
        throw new Error(`unknown path: ${request.url}`);
      }
    }
  });
  return server;
};

const offer = (websocket: WebSocket) => {
  offerer = websocket;
};

const seek = (websocket: WebSocket) => {
  websocket.onmessage = (event: MessageEvent) => {
    offerer?.send(event.data);
  };
};
