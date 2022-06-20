import * as uuid from "uuid";
import {
  ComponentType,
  createElement,
  ReactElement,
  useEffect,
  useState,
} from "react";
import * as ReactDOM from "react-dom/client";
import { Channel, connect } from "../src/webrtcClient";
import { webrtcAdapter } from "../src/webrtcAdapter";
import React from "react";

const App = ({ a, b }: { a: string; b: string }) => {
  return (
    <>
      <HelloWorldPeer
        name="a"
        signalingServer={"ws://localhost:1233"}
        offer={a}
        seek={b}
        initiator={true}
      />
      <br />
      <HelloWorldPeer
        name="b"
        signalingServer={"ws://localhost:1233"}
        offer={b}
        seek={a}
        initiator={false}
      />
    </>
  );
};

const HelloWorldPeer = (props: {
  signalingServer: string;
  name: string;
  offer: string;
  seek: string;
  initiator: boolean;
}): ReactElement =>
  withLoader(
    () => connect({ ...props, webrtcAdapter }),
    (peer: Channel) => () => {
      useEffect(() => {
        (async () => {
          if (props.initiator) {
            peer.send("ping from initiator");
          } else {
            peer.send("ping from joiner");
          }
        })();
      }, []);

      const [received, setReceived] = useState<string>("");
      useEffect(() => {
        (async () => {
          while (true) {
            setReceived(await peer.next());
          }
        })();
      }, [setReceived]);

      return (
        <div>
          Peer: {props.name}
          <br />
          {received}
        </div>
      );
    }
  );

function withLoader<T>(
  load: () => Promise<T>,
  makeComponent: (loaded: T) => ComponentType
): ReactElement {
  const [inner, setInner] = useState<ReactElement>(<div>loading...</div>);
  useEffect(() => {
    (async () => {
      const t = await load();
      setInner(createElement(makeComponent(t)));
    })();
  }, []);
  return inner;
}

const root = document.getElementById("root");
if (root) {
  const a = uuid.v4();
  const b = uuid.v4();
  ReactDOM.createRoot(root).render(<App {...{ a, b }} />);
}
