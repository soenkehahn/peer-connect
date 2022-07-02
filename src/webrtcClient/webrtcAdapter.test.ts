import { webrtcAdapter } from "./webrtcAdapter";
import { HasColor } from "../signalingClient";
import { Channel } from "../utils/channel";

jest.setTimeout(1000);

describe("webrtcAdapter", () => {
  let signalingMock: {
    channel: Channel & HasColor;
    isClosed: boolean;
    sends: Array<string>;
  };
  beforeEach(() => {
    signalingMock = {
      channel: {
        next(): Promise<string> {
          return new Promise(() => {});
        },
        send(message: string) {
          signalingMock.sends.push(message);
        },
        close() {
          signalingMock.isClosed = true;
        },
        color: "blue" as const,
      },
      isClosed: false,
      sends: [],
    };
  });

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

    isClosed: boolean = false;
    close() {
      this.isClosed = true;
    }

    addEventListener() {}
    ondatachannel?: (event: { channel: RTCDataChannelMock }) => void;
    onicecandidate?: (event: { candidate: unknown }) => void;
  }

  class RTCDataChannelMock {
    constructor() {
      if (rtcDataChannelMock !== null) {
        throw "mock initialized twice";
      }
      rtcDataChannelMock = this;
    }

    sent: Array<string> = [];

    send(message: string) {
      this.sent.push(message);
    }

    closeHandlers: Array<() => void> = [];
    addEventListener(event: string, handler: () => void) {
      if (event !== "close") {
        throw `addEventListener: unknown event: ${event}`;
      }
      this.closeHandlers.push(handler);
    }
    close() {
      for (const handler of this.closeHandlers) {
        handler();
      }
    }
    onopen?: () => void;
    onmessage?: (event: { data: string }) => void;
    onclose?: () => void;
  }

  let rtcPeerConnectionMock: null | RTCPeerConnectionMock;
  let rtcDataChannelMock: null | RTCDataChannelMock;
  beforeEach(() => {
    (global as any).RTCPeerConnection = RTCPeerConnectionMock;
    rtcPeerConnectionMock = null;
    rtcDataChannelMock = null;
  });

  async function setupInitiator(): Promise<Channel> {
    const webrtcChannelPromise = webrtcAdapter.promote(signalingMock.channel);
    rtcDataChannelMock?.onopen?.();
    return await webrtcChannelPromise;
  }

  async function setupJoiner(): Promise<Channel> {
    const webrtcChannelPromise = webrtcAdapter.promote(signalingMock.channel);
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

      it("closes the signaling channel once the webrtc connection is established", async () => {
        expect(signalingMock.isClosed).toEqual(false);
        await setupWebrtcChannel();
        expect(signalingMock.isClosed).toEqual(true);
      });

      it("stops trying to send ice candidates after the data channel is established", async () => {
        await setupWebrtcChannel();
        rtcPeerConnectionMock?.onicecandidate?.({ candidate: null });
        expect(signalingMock.sends).toEqual([]);
      });

      it("calls onclose when the data channel is closed from the other side", async () => {
        const webrtcChannel = await setupWebrtcChannel();
        let closed = false;
        webrtcChannel.onclose = () => {
          closed = true;
        };
        rtcDataChannelMock?.onclose?.();
        expect(closed).toEqual(true);
      });

      it("allows to close the peer connection", async () => {
        const webrtcChannel = await setupWebrtcChannel();
        webrtcChannel.close();
        expect(rtcPeerConnectionMock?.isClosed).toEqual(true);
      });
    });
  }
});
