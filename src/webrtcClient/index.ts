import { connect as signalingConnect, HasColor } from "../signalingClient";
import { Channel } from "../utils/channel";
import { webrtcAdapter } from "./webrtcAdapter";

export type WebrtcAdapter = {
  promote: (
    channel: Channel & HasColor,
    rtcConfiguration?: RTCConfiguration
  ) => Promise<Channel>;
};

export const connect = async ({
  signalingServer,
  rtcConfiguration,
  id,
  disallow,
  offer,
  seek,
}: {
  signalingServer: string;
  rtcConfiguration?: RTCConfiguration;
  id: string;
  disallow: Array<string>;
  offer: string;
  seek: string;
}): Promise<Channel> => {
  const signalingChannel = await signalingConnect({
    url: signalingServer,
    id,
    disallow,
    offer,
    seek,
  });
  return await webrtcAdapter.promote(signalingChannel, rtcConfiguration);
};
