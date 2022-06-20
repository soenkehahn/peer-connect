import { spawn } from "child_process";
import { runServer } from "./src/server";

(async () => {
  const signalingServer = await runServer({ port: 1233 });

  const parcel = spawn("parcel", ["example/hello-world.html"], {
    stdio: "inherit",
  });

  const cypress = spawn("cypress", ["run"], { stdio: "inherit" });
  await new Promise((resolve) => cypress.on("exit", resolve));

  parcel.kill();
  signalingServer.close();
})();
