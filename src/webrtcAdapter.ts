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
    connection.addEventListener("icecandidateerror", (e) => {
      if (e instanceof RTCPeerConnectionIceErrorEvent) {
        console.error(`warning: ${e.errorText}`);
      } else {
        console.error(`warning: ${e}`);
      }
    });
    handleSignallingMessages(connection, signalingChannel);
    if (signalingChannel.color === "blue") {
      const rtcDataChannel = connection.createDataChannel("my channel");
      return new Promise<Channel>((resolve) => {
        rtcDataChannel.onopen = () => {
          rtcDataChannel.addEventListener("close", () => {
            connection.close();
          });
          resolve(fromRtcDataChannel(rtcDataChannel));
        };
      });
    } else {
      return new Promise<Channel>((resolve) => {
        connection.ondatachannel = (event) => {
          event.channel.onopen = () => {
            event.channel.addEventListener("close", () => {
              connection.close();
            });
            resolve(fromRtcDataChannel(event.channel));
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
        const json = await signalingChannel.next();
        if (json === null) {
          throw new Error("expected signaling messages");
        }
        const message = JSON.parse(json);
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
