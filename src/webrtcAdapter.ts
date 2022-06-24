import { HasColor } from "./signalingClient";
import { Channel, fromRtcDataChannel } from "./utils/channel";
import { Closeable, WebrtcAdapter } from "./webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (
    signalingChannel: Channel & HasColor
  ): Promise<Channel & Closeable> => {
    const connection: RTCPeerConnection = new RTCPeerConnection({});
    connection.onnegotiationneeded = async () => {
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      signalingChannel.send(
        JSON.stringify({ desc: connection.localDescription })
      );
    };
    connection.onicecandidate = ({ candidate }) => {
      signalingChannel.send(JSON.stringify({ candidate }));
    };
    handleSignallingMessages(connection, signalingChannel);
    if (signalingChannel.color === "blue") {
      const rtcDataChannel = connection.createDataChannel("my channel");
      return new Promise<Channel & Closeable>((resolve) => {
        rtcDataChannel.onopen = () => {
          resolve(toChannel(connection, rtcDataChannel));
        };
      });
    } else {
      return new Promise<Channel & Closeable>((resolve) => {
        connection.ondatachannel = (event) => {
          event.channel.onopen = () => {
            resolve(toChannel(connection, event.channel));
          };
        };
      });
    }
  },
};

function toChannel(
  connection: RTCPeerConnection,
  rtcDataChannel: RTCDataChannel
): Channel & Closeable {
  const channel: Channel & Closeable = {
    ...fromRtcDataChannel(rtcDataChannel),
    close: () => {
      connection.close();
    },
  };
  rtcDataChannel.onclose = () => {
    channel.onclose?.();
  };
  return channel;
}

function handleSignallingMessages(
  connection: RTCPeerConnection,
  signalingChannel: Channel
): void {
  void (async () => {
    try {
      while (true) {
        const message = JSON.parse(await signalingChannel.next());
        if (message.desc) {
          const desc = message.desc;
          if (desc.type === "offer") {
            await connection.setRemoteDescription(desc);
            const localDescription = await connection.createAnswer();
            await connection.setLocalDescription(localDescription);
            signalingChannel.send(JSON.stringify({ desc: localDescription }));
          } else if (desc.type === "answer") {
            await connection.setRemoteDescription(desc);
          } else {
            console.log("Unsupported SDP type.");
          }
        } else if (message.candidate) {
          const candidate = message.candidate;
          await connection.addIceCandidate(candidate);
        }
      }
    } catch (err) {
      console.error(err);
    }
  })();
}
