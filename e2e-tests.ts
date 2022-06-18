import { spawn, spawnSync } from "child_process";
import { runServer } from "./src/server";

(async () => {
  const signalingServer = await runServer({ port: 1233 });

  const parcel = spawn("parcel", ["example/chat.html"], {
    stdio: "inherit",
  });

  spawnSync("cypress", ["run"], { stdio: "inherit" });

  parcel.kill();
  signalingServer.close();
})();
