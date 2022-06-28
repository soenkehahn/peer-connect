import { spawn } from "child_process";
import { runServer } from "./src/server";

const exampleFile = process.argv[2] || "example/chat.html";

console.error(`Running ${exampleFile}`);

(async () => {
  await runServer({ port: 1233 });

  spawn("parcel", [exampleFile, "--no-autoinstall"], {
    stdio: "inherit",
  });
})();
