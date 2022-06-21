import { Api, makeServer, ToServer } from "./api";
import { connect as webrtcConnect } from "./webrtcClient";

export const connect = async <Offer extends Api, Seek extends Api>(args: {
  signalingServer: string;
  offer: Offer;
  server: ToServer<Offer>;
  seek: Seek;
}): Promise<ToServer<Seek>> => {
  const offerString = JSON.stringify(args.offer);
  const seekString = JSON.stringify(args.seek);
  const channel = await webrtcConnect({
    signalingServer: args.signalingServer,
    offer: offerString,
    seek: seekString,
  });
  let requestCounter = 0;
  let waitingResolves: Map<Number, (_value: unknown) => void> = new Map();
  (async () => {
    while (true) {
      const message = JSON.parse(await channel.next());
      if (message.type === "request") {
        const id = message.id;
        const response = {
          type: "response",
          id,
          output: await args.server[message.endpoint](message.input),
        };
        channel.send(JSON.stringify(response));
      } else if (message.type === "response") {
        const id = message.id;
        waitingResolves.get(id)?.(message.output);
        waitingResolves.delete(id);
      } else {
        throw new Error(`unknown message type: ${message.type}`);
      }
    }
  })();
  return makeServer(args.seek, async (message: unknown): Promise<unknown> => {
    (message as any).type = "request";
    let id = requestCounter++;
    (message as any).id = id;
    channel.send(JSON.stringify(message));
    return new Promise((resolve) => {
      waitingResolves.set(id, resolve);
    });
  });
};
