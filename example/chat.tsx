import React, { useEffect, useState } from "react";
import * as uuid from "uuid";
import * as ReactDOM from "react-dom/client";
import { connect, ToPeer } from "../src/apiClient";

const chatApi: ChatApi = {
  sendMessage: {
    input: "string",
    output: null,
  },
};

type ChatApi = {
  sendMessage: {
    input: "string";
    output: null;
  };
};

const id = uuid.v4();

const App = () => {
  const [peer, setPeer] = useState<ToPeer<ChatApi> | null>(null);
  const [messages, setMessages] = useState<{ inner: Array<string> }>({
    inner: [],
  });
  useEffect(() => {
    connect({
      signalingServer: "ws://localhost:1233",
      id,
      offer: chatApi,
      server: {
        sendMessage: (message: string) => {
          messages.inner.push(message);
          setMessages({ ...messages });
          return null;
        },
        close() {},
      },
      seek: chatApi,
    }).then(setPeer);
  }, []);

  const [inputValue, setInputValue] = useState("");
  const handleKeyDown = (key: string) => {
    if (key === "Enter") {
      peer?.sendMessage(inputValue);
      setInputValue("");
    }
  };

  if (!peer) {
    return <div>not connected...</div>;
  }

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
};

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
