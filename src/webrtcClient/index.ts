import { parseJSON, ToType } from "../apiClient/types";
import * as t from "../apiClient/types";
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
  disallow: DisallowPool;
  offer: string;
  seek: string;
}): Promise<Channel> => {
  const signalingChannel = await signalingConnect({
    url: signalingServer,
    id,
    disallow: disallow.ids,
    offer,
    seek,
  });
  const peer = await webrtcAdapter.promote(signalingChannel, rtcConfiguration);
  const handshakeToSend: Handshake = { id };
  peer.send(JSON.stringify(handshakeToSend));
  const rawReceivedHandshake = await peer.next();
  if (rawReceivedHandshake === null) {
    throw "expected: Handshake, connection closed";
  }
  const receivedHandshake = parseJSON(Handshake, rawReceivedHandshake);
  disallow.ids.push(receivedHandshake.id);
  return peer;
};

type Handshake = ToType<typeof Handshake>;

const Handshake = { id: t.string };

export class DisallowPool {
  ids: Array<string> = [];

  constructor(ids?: Array<string>) {
    if (ids != null) {
      this.ids = ids;
    }
  }
}
