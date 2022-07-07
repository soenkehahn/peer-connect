import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { connect, ToPeer } from "../src/apiClient";
import React from "react";
import * as t from "../src/apiClient/types";

const App = () => {
  return (
    <>
      <HelloWorldPeer name="a" signalingServer={"ws://localhost:1233"} />
      <hr />
      <HelloWorldPeer name="b" signalingServer={"ws://localhost:1233"} />
    </>
  );
};

const pingApi: PingApi = {
  ping: {
    input: t.string,
    output: null,
  },
};

type PingApi = {
  ping: {
    input: t.stringType;
    output: null;
  };
};

const HelloWorldPeer = (props: { signalingServer: string; name: string }) => {
  const [counter, setCounter] = useState(0);
  const [peer, setPeer] = useState<null | ToPeer<PingApi> | "closed">(null);
  const [received, setReceived] = useState<string>("");

  useEffect(() => {
    connect({
      signalingServer: props.signalingServer,
      id: props.name,
      offer: pingApi,
      server: {
        ping: (message: string) => {
          setReceived(message);
          return null;
        },
        close: () => {
          setPeer("closed");
        },
      },
      seek: pingApi,
    }).then((peer) => {
      peer.ping(`ping from ${props.name}`);
      setPeer(peer);
    });
  }, [setReceived]);

  useEffect(() => {
    (async () => {
      if (peer !== "closed") {
        peer?.ping(`ping from ${props.name}`);
      }
    })();
  }, [peer]);

  return (
    <div>
      Peer: {props.name}
      <br />
      <button
        onClick={() => {
          if (peer !== "closed") {
            peer?.ping(`ping from ${props.name}: ${counter}`);
          }
          setCounter(counter + 1);
        }}
      >
        send ping
      </button>
      <br />
      {peer === "closed" ? (
        `${props.name} is closed`
      ) : (
        <button onClick={() => peer?.close()}>close {props.name}</button>
      )}
      <br />
      {received}
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
