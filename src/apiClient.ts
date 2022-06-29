import { Api, makeServer, ToServer } from "./api";
import { connect as webrtcConnect } from "./webrtcClient";

export type ToPeer<T extends Api> = ToServer<T> & { close: () => void };

export const connect = async <Offer extends Api, Seek extends Api>(args: {
  signalingServer: string;
  rtcConfiguration?: RTCConfiguration;
  id: string;
  disallow?: Array<string>;
  offer: Offer;
  server: ToPeer<Offer>;
  seek: Seek;
}): Promise<ToPeer<Seek>> => {
  const offerString = JSON.stringify(args.offer);
  const seekString = JSON.stringify(args.seek);
  const channel = await webrtcConnect({
    signalingServer: args.signalingServer,
    rtcConfiguration: args.rtcConfiguration,
    id: args.id,
    disallow: args.disallow || [],
    offer: offerString,
    seek: seekString,
  });
  let requestCounter = 0;
  let waitingResolves: Map<Number, (_value: unknown) => void> = new Map();
  (async () => {
    while (true) {
      const json = await channel.next();
      if (json === null) {
        break;
      }
      const message = JSON.parse(json);
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
  channel.onclose = () => args.server.close();
  return {
    ...makeServer(args.seek, async (message: unknown): Promise<unknown> => {
      (message as any).type = "request";
      let id = requestCounter++;
      (message as any).id = id;
      channel.send(JSON.stringify(message));
      return new Promise((resolve) => {
        waitingResolves.set(id, resolve);
      });
    }),
    close() {
      channel.close();
    },
  };
};
