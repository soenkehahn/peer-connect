type Offerer = {
  nextMessage: Promise<string>;
};

export const offer = async (url: string): Promise<Offerer> => {
  const websocket = new WebSocket(url);
  await new Promise<void>((resolve) => {
    websocket.onopen = () => {
      resolve();
    };
  });
  const result = {
    nextMessage: new Promise<string>(() => {}),
  };
  function makeNextMessage(): Promise<string> {
    return new Promise<string>((resolve) => {
      websocket.onmessage = (event) => {
        result.nextMessage = makeNextMessage();
        resolve(event.data);
      };
    });
  }
  result.nextMessage = makeNextMessage();
  return result;
};

type Seeker = {
  send: (message: string) => void;
};

export const seek = async (url: string): Promise<Seeker> => {
  const websocket = new WebSocket(url);
  await new Promise<void>((resolve) => {
    websocket.onopen = () => {
      resolve();
    };
  });
  return {
    send: (message: string) => {
      websocket.send(message);
    },
  };
};
