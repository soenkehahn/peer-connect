import { webrtcAdapter } from "./webrtcAdapter";
import { Channel, HasColor } from "./signalingClient";

jest.setTimeout(1000);

describe("webrtcAdapter", () => {
  class RTCPeerConnectionMock {
    constructor() {
      if (rtcPeerConnectionMock !== null) {
        throw "mock initialized twice";
      }
      rtcPeerConnectionMock = this;
    }

    createDataChannel() {
      return new RTCDataChannelMock();
    }

    ondatachannel?: (event: { channel: RTCDataChannelMock }) => void;
  }

  class RTCDataChannelMock {
    constructor() {
      if (rtcDataChannelMock !== null) {
        throw "mock initialized twice";
      }
      rtcDataChannelMock = this;
    }

    onopen?: () => void;
    onmessage?: (event: { data: string }) => void;

    sent: Array<string> = [];

    send(message: string) {
      this.sent.push(message);
    }
  }

  let rtcPeerConnectionMock: null | RTCPeerConnectionMock;
  let rtcDataChannelMock: null | RTCDataChannelMock;
  beforeEach(() => {
    (global as any).RTCPeerConnection = RTCPeerConnectionMock;
    rtcPeerConnectionMock = null;
    rtcDataChannelMock = null;
  });

  async function setupInitiator(): Promise<Channel> {
    const mockSignalingChannel: Channel & HasColor = {
      next() {
        return new Promise(() => {});
      },
      send() {
        throw "send";
      },
      color: "blue",
    };
    const webrtcChannelPromise = webrtcAdapter.promote(mockSignalingChannel);
    rtcDataChannelMock?.onopen?.();
    return await webrtcChannelPromise;
  }

  async function setupJoiner(): Promise<Channel> {
    const mockSignalingChannel: Channel & HasColor = {
      next() {
        return new Promise(() => {});
      },
      send() {
        throw "send";
      },
      color: "green",
    };
    const webrtcChannelPromise = webrtcAdapter.promote(mockSignalingChannel);
    rtcPeerConnectionMock?.ondatachannel?.({
      channel: new RTCDataChannelMock(),
    });
    rtcDataChannelMock?.onopen?.();
    return await webrtcChannelPromise;
  }

  const setups: Array<[string, () => Promise<Channel>]> = [
    ["when initiating the rtc data channel", setupInitiator],
    ["when joining the rtc data channel", setupJoiner],
  ];

  for (const [description, setupWebrtcChannel] of setups) {
    describe(description, () => {
      it("sends messages over the rtc data channel", async () => {
        const webrtcChannel = await setupWebrtcChannel();
        webrtcChannel.send("foo");
        expect(rtcDataChannelMock?.sent).toEqual(["foo"]);
      });

      it("receives messages from the rtc data channel", async () => {
        const webrtcChannel = await setupWebrtcChannel();
        const messagePromise = webrtcChannel.next();
        rtcDataChannelMock?.onmessage?.({ data: "foo" });
        expect(await messagePromise).toEqual("foo");
      });
    });
  }
});
