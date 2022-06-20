import { HasColor } from "./signalingClient";
import { Channel, rtcDataChannelToPeer } from "./utils/channel";
import { WebrtcAdapter } from "./webrtcClient";

export const webrtcAdapter: WebrtcAdapter = {
  promote: async (signalingChannel: Channel & HasColor): Promise<Channel> => {
    const connection: RTCPeerConnection = new RTCPeerConnection({});
    return new Promise<Channel>((resolve) => {
      if (signalingChannel.color === "blue") {
        connection.onicecandidate = ({ candidate }) => {
          signalingChannel.send(JSON.stringify({ candidate }));
        };
        connection.onnegotiationneeded = async () => {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          signalingChannel.send(
            JSON.stringify({ desc: connection.localDescription })
          );
        };
        const channel = connection.createDataChannel("my channel");
        channel.addEventListener("open", () => {
          resolve(rtcDataChannelToPeer(channel));
        });
        handleSignallingMessages(connection, signalingChannel);
      } else {
        connection.onnegotiationneeded = () => {
          throw "negotiation needed";
        };
        connection.onicecandidate = ({ candidate }) => {
          signalingChannel.send(JSON.stringify({ candidate }));
        };
        connection.ondatachannel = (event) => {
          const channel = event.channel;
          channel.onopen = () => {
            resolve(rtcDataChannelToPeer(channel));
          };
        };
        handleSignallingMessages(connection, signalingChannel);
      }
    });
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
