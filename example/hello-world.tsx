import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { connect } from "../src/apiClient";
import React from "react";
import { ToServer } from "../src/api";

const App = () => {
  return (
    <>
      <HelloWorldPeer name="a" signalingServer={"ws://localhost:1233"} />
      <br />
      <HelloWorldPeer name="b" signalingServer={"ws://localhost:1233"} />
    </>
  );
};

const pingApi: PingApi = {
  ping: {
    input: "string",
    output: null,
  },
};

type PingApi = {
  ping: {
    input: "string";
    output: null;
  };
};

const HelloWorldPeer = (props: { signalingServer: string; name: string }) => {
  const [peer, setPeer] = useState<ToServer<PingApi> | null>(null);
  const [received, setReceived] = useState<string>("");

  useEffect(() => {
    connect({
      signalingServer: props.signalingServer,
      offer: pingApi,
      server: {
        ping: (message) => {
          setReceived(message);
          return null;
        },
      },
      seek: pingApi,
    }).then(setPeer);
  }, [setReceived]);

  useEffect(() => {
    (async () => {
      peer?.ping(`ping from ${props.name}`);
    })();
  }, [peer]);

  return (
    <div>
      Peer: {props.name}
      <br />
      {received}
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
