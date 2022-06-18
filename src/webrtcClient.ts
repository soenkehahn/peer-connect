import { Peer, connect as signalingConnect } from "./signalingClient";
export { Peer } from "./signalingClient";

export type WebrtcAdapter = {
  promote: (peer: Peer, initiator: boolean) => Promise<Peer>;
};

export const connect = async (args: {
  signalingServer: string;
  offer: string;
  seek: string;
  webrtcAdapter: WebrtcAdapter;
  initiator: boolean;
}): Promise<Peer> => {
  return await args.webrtcAdapter.promote(
    await signalingConnect({
      url: args.signalingServer,
      offer: args.offer,
      seek: args.seek,
    }),
    args.initiator
  );
};
