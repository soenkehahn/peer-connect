import { connect as signalingConnect, HasColor } from "./signalingClient";
import { Channel } from "./utils/channel";
import { webrtcAdapter } from "./webrtcAdapter";
export { Channel } from "./utils/channel";

export type Closeable = {
  onclose?: () => void;
  close: () => void;
};

export type WebrtcAdapter = {
  promote: (channel: Channel & HasColor) => Promise<Channel & Closeable>;
};

export const connect = async (args: {
  signalingServer: string;
  offer: string;
  seek: string;
}): Promise<Channel> => {
  const signalingChannel = await signalingConnect({
    url: args.signalingServer,
    offer: args.offer,
    seek: args.seek,
  });
  return await webrtcAdapter.promote(signalingChannel);
};
