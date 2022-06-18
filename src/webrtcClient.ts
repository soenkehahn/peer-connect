import { Peer, connect as signalingConnect } from "./signalingClient";
export { Peer } from "./signalingClient";

type WebrtcAdapter = {
  promote: (peer: Peer) => Promise<Peer>;
};

export const connect = async (args: {
  signalingServer: string;
  offer: string;
  seek: string;
  webrtcAdapter: WebrtcAdapter;
}): Promise<Peer> => {
  return await args.webrtcAdapter.promote(
    await signalingConnect({
      url: args.signalingServer,
      offer: args.offer,
      seek: args.seek,
    })
  );
};
