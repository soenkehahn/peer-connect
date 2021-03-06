import * as uuid from "uuid";
import { withLoader } from "./loader";
import { ReactElement, useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { Channel, connect } from "../src/webrtcClient";
import React from "react";

const App = ({ a, b }: { a: string; b: string }) => {
  return (
    <>
      <HelloWorldPeer
        name="a"
        signalingServer={"ws://localhost:1233"}
        offer={a}
        seek={b}
      />
      <br />
      <HelloWorldPeer
        name="b"
        signalingServer={"ws://localhost:1233"}
        offer={b}
        seek={a}
      />
    </>
  );
};

const HelloWorldPeer = (props: {
  signalingServer: string;
  name: string;
  offer: string;
  seek: string;
}): ReactElement =>
  withLoader(
    () => connect({ ...props }),
    (peer: Channel) => () => {
      useEffect(() => {
        (async () => {
          peer.send(`ping from ${props.name}`);
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

const root = document.getElementById("root");
if (root) {
  const a = uuid.v4();
  const b = uuid.v4();
  ReactDOM.createRoot(root).render(<App {...{ a, b }} />);
}
