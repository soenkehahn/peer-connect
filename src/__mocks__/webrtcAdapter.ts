import { HasColor } from "../signalingClient";
import { Channel, Closeable } from "../utils/channel";
import { WebrtcAdapter } from "../webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (
    signalingChannel: Channel & HasColor
  ): Promise<Channel & Closeable> => {
    return {
      ...signalingChannel,
      close() {
        throw "NYI: close() on webrtcAdapter mock";
      },
    };
  },
};
