export type Channel = {
  next: () => Promise<string>;
  send: (message: string) => void;
};

export const websocketChannel = (url: string): Promise<Channel> => {
  const websocket = new WebSocket(url);
  return new Promise<Channel>((resolve, reject) => {
    websocket.onerror = (event) => {
      reject(event);
    };
    websocket.onopen = () => {
      const bufferedMessages: Array<string> = [];
      const bufferedResolves: Array<(message: string) => void> = [];

      websocket.onmessage = (event: MessageEvent) => {
        if (bufferedResolves.length > 0) {
          const call = bufferedResolves.pop() as (message: string) => void;
          call(event.data);
        } else {
          bufferedMessages.push(event.data);
        }
      };

      resolve({
        next: () =>
          new Promise((resolve) => {
            if (bufferedMessages.length > 0) {
              const next = bufferedMessages.pop() as string;
              resolve(next);
            } else {
              bufferedResolves.push(resolve);
            }
          }),

        send: (message: string) => {
          websocket.send(message);
        },
      });
    };
  });
};
