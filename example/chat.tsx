import React, { useState } from "react";
import * as ReactDOM from "react-dom/client";
import { Channel, connect } from "../src/webrtcClient";
import { webrtcAdapter } from "../src/webrtcAdapter";
import { withLoader } from "./loader";

const App = () =>
  withLoader(
    () =>
      connect({
        webrtcAdapter,
        signalingServer: "ws://localhost:1233",
        offer: "chat",
        seek: "chat",
      }),
    (peer: Channel) => () => {
      const [messages, setMessages] = useState<{ inner: Array<string> }>({
        inner: [],
      });
      (async () => {
        while (true) {
          const message = await peer.next();
          messages.inner.push(message);
          setMessages({ ...messages });
        }
      })();

      const [inputValue, setInputValue] = useState("");
      const handleKeyDown = (key: string) => {
        if (key === "Enter") {
          peer.send(inputValue);
          setInputValue("");
        }
      };

      return (
        <>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => handleKeyDown(event.key)}
          />
          <br />
          <ul>
            {messages.inner.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </>
      );
    }
  );

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
