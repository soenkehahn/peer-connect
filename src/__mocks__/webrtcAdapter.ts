import { HasColor } from "../signalingClient";
import { Channel, WebrtcAdapter } from "../webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (signalingChannel: Channel & HasColor): Promise<Channel> => {
    return signalingChannel;
  },
};
