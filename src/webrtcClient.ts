import { connect as signalingConnect, HasColor } from "./signalingClient";
import { Channel } from "./utils/channel";
export { Channel } from "./utils/channel";

export type WebrtcAdapter = {
  promote: (channel: Channel & HasColor) => Promise<Channel>;
};

export const connect = async (args: {
  signalingServer: string;
  offer: string;
  seek: string;
  webrtcAdapter: WebrtcAdapter;
}): Promise<Channel> => {
  const signalingChannel = await signalingConnect({
    url: args.signalingServer,
    offer: args.offer,
    seek: args.seek,
  });
  return await args.webrtcAdapter.promote(signalingChannel);
};
