export type Peer = {
  send: (message: string) => void;
  nextReceived: Promise<string>;
};

export const connect = async (args: {
  url: string;
  offer: string;
  seek: string;
}): Promise<Peer> => {
  const websocket = new WebSocket(
    `${args.url}/?offer=${args.offer}&seek=${args.seek}`
  );
  await new Promise<void>((resolve) => {
    websocket.onopen = () => {
      resolve();
    };
  });
  const result = {
    send: (message: string) => {
      websocket.send(message);
    },
    nextReceived: new Promise<string>(() => {}),
  };
  const makeNextReceived = (): Promise<string> => {
    return new Promise<string>((resolve) => {
      websocket.onmessage = (event) => {
        result.nextReceived = makeNextReceived();
        resolve(event.data);
      };
    });
  };
  result.nextReceived = makeNextReceived();
  return result;
};
