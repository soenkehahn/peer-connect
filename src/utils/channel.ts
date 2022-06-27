export type Channel = {
  next: () => Promise<string>;
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
      const channel: Channel = {
        ...makeChannel(websocket),
        close() {
          websocket.close();
        },
      };
      websocket.onclose = () => {
        channel.onclose?.();
      };
      resolve(channel);
    };
  });
};

export function fromRtcDataChannel(
  connection: RTCPeerConnection,
  rtcDataChannel: RTCDataChannel
): Channel {
  const channel: Channel = {
    ...makeChannel(rtcDataChannel),
    close: () => {
      connection.close();
    },
  };
  rtcDataChannel.onclose = () => {
    channel.onclose?.();
  };
  return channel;
}

const makeChannel = (inner: {
  send: (message: string) => void;
  onmessage: ((event: MessageEvent) => any) | null;
}): {
  next: () => Promise<string>;
  send: (message: string) => void;
} => {
  const bufferedMessages: Array<string> = [];
  const bufferedResolves: Array<(message: string) => void> = [];

  inner.onmessage = (event: MessageEvent) => {
    if (bufferedResolves.length > 0) {
      const call = bufferedResolves.pop() as (message: string) => void;
      call(event.data);
    } else {
      bufferedMessages.push(event.data);
    }
  };

  return {
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
      inner.send(message);
    },
  };
};
