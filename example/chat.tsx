import * as ReactDOM from "react-dom/client";

const App = () => <div>hello world</div>;

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}
