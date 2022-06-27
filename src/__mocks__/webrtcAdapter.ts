import { HasColor } from "../signalingClient";
import { Channel } from "../utils/channel";
import { WebrtcAdapter } from "../webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (signalingChannel: Channel & HasColor): Promise<Channel> => {
    return {
      ...signalingChannel,
      close() {
        throw "NYI: close() on webrtcAdapter mock";
      },
    };
  },
};
