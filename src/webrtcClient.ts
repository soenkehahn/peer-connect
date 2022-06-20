import { connect as signalingConnect, Colored } from "./signalingClient";
import { Channel } from "./utils/channel";
export { Channel } from "./utils/channel";

export type WebrtcAdapter = {
  promote: (channel: Channel & Colored, initiator: boolean) => Promise<Channel>;
};

export const connect = async (args: {
  signalingServer: string;
  offer: string;
  seek: string;
  webrtcAdapter: WebrtcAdapter;
  initiator: boolean;
}): Promise<Channel> => {
  return await args.webrtcAdapter.promote(
    await signalingConnect({
      url: args.signalingServer,
      offer: args.offer,
      seek: args.seek,
    }),
    args.initiator
  );
};
