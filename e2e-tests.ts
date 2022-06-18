import { spawn, spawnSync } from "child_process";

const parcel = spawn("parcel", ["example/chat.html", "--no-autoinstall"], {
  stdio: "inherit",
});

spawnSync("cypress", ["run"], { stdio: "inherit" });

parcel.kill();
