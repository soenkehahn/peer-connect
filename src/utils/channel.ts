export type Channel = {
  next: () => Promise<string | null>;
  send: (message: string) => void;
  onclose?: () => void;
  close: () => void;
};

export const websocketChannel = (url: string): Promise<Channel> => {
  const websocket = new WebSocket(url);
  return new Promise<Channel>((resolve, reject) => {
    websocket.onerror = (event) => {
      reject(event);
    };
    websocket.onopen = () => {
      resolve(makeChannel(websocket));
    };
  });
};

export function fromRtcDataChannel(rtcDataChannel: RTCDataChannel): Channel {
  return makeChannel(rtcDataChannel);
}

const makeChannel = (innerChannel: {
  send: (message: string) => void;
  onmessage: ((event: MessageEvent) => any) | null;
  close: () => void;
  onclose?:
    | ((this: RTCDataChannel & WebSocket, event: Event & CloseEvent) => any)
    | null;
}): Channel => {
  const bufferedMessages: Array<string> = [];
  const bufferedResolves: Array<(message: string | null) => void> = [];

  innerChannel.onmessage = (event: MessageEvent) => {
    if (bufferedResolves.length > 0) {
      const call = bufferedResolves.pop() as (message: string) => void;
      call(event.data);
    } else {
      bufferedMessages.push(event.data);
    }
  };

  let closed = false;

  const channel: Channel = {
    next: () => {
      if (closed) {
        return Promise.resolve(null);
      }
      return new Promise<string | null>((resolve) => {
        if (bufferedMessages.length > 0) {
          const next = bufferedMessages.pop() as string;
          resolve(next);
        } else {
          bufferedResolves.push(resolve);
        }
      });
    },

    send: (message: string) => {
      if (closed) {
        throw new Error("cannot send: peer is closed");
      }
      innerChannel.send(message);
    },

    close() {
      closed = true;
      innerChannel.close();
      for (const resolve of bufferedResolves) {
        resolve(null);
      }
    },
  };
  innerChannel.onclose = () => {
    channel.close();
    channel.onclose?.();
  };
  return channel;
};
