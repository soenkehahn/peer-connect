import { connect, ToPeer } from "./apiClient";
import { Api } from "./apiClient/api";
import { DisallowPool } from "./webrtcClient";

export const newSlot = <Offer extends Api, Seek extends Api>({
  signalingServer,
  rtcConfiguration,
  id,
  disallow,
  offer,
  handler,
  seek,
  handlePeer,
}: {
  signalingServer: string;
  rtcConfiguration?: RTCConfiguration;
  id: string;
  disallow?: DisallowPool;
  offer: Offer;
  handler: ToPeer<Offer>;
  seek: Seek;
  handlePeer: (peer: ToPeer<Seek>) => void;
}): { connected: Promise<void> } => {
  const peer = connect({
    signalingServer,
    rtcConfiguration,
    id,
    disallow,
    offer,
    server: {
      ...handler,
      close() {
        handler.close();
        newSlot({
          signalingServer,
          rtcConfiguration,
          id,
          disallow,
          offer,
          handler,
          seek,
          handlePeer,
        });
      },
    },
    seek,
  });
  peer.then((p) => {
    handlePeer(p);
  });
  return { connected: peer.then(() => {}) };
};
