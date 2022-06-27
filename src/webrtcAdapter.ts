import { HasColor } from "./signalingClient";
import { Channel, fromRtcDataChannel } from "./utils/channel";
import { WebrtcAdapter } from "./webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (signalingChannel: Channel & HasColor): Promise<Channel> => {
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
      return new Promise<Channel>((resolve) => {
        rtcDataChannel.onopen = () => {
          resolve(fromRtcDataChannel(connection, rtcDataChannel));
        };
      });
    } else {
      return new Promise<Channel>((resolve) => {
        connection.ondatachannel = (event) => {
          event.channel.onopen = () => {
            resolve(fromRtcDataChannel(connection, event.channel));
          };
        };
      });
    }
  },
};

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
