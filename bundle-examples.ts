import { spawnSync } from "child_process";
import { readdir } from "fs/promises";

(async () => {
  spawnSync("rm", ["-rf", "./dist"], {
    stdio: "inherit",
  });

  const htmlFiles = (await readdir("example")).filter((file) =>
    file.endsWith(".html")
  );

  for (const htmlFile of htmlFiles) {
    console.log(`bundling ${htmlFile}...`);
    spawnSync(
      "parcel",
      [
        "build",
        `example/${htmlFile}`,
        "--no-autoinstall",
        "--target",
        "example",
        "--dist-dir",
        "dist",
      ],
      {
        stdio: "inherit",
      }
    );
  }
})();
