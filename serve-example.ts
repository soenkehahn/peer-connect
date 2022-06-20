import { spawn } from "child_process";
import { runServer } from "./src/server";

(async () => {
  await runServer({ port: 1233 });

  spawn("parcel", ["example/hello-world.html"], {
    stdio: "inherit",
  });
})();
