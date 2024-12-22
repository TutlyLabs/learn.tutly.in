import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vscodeSrc = join(__dirname, "../node_modules/vscode-web/dist");
const vscodeDest = join(__dirname, "../public/vscode");

async function copyVSCodeFiles() {
  try {

    await fs.ensureDir(join(vscodeDest, "out"));
    await fs.ensureDir(join(vscodeDest, "extensions"));
    await fs.ensureDir(join(vscodeDest, "node_modules"));

    await fs.copy(join(vscodeSrc, "out"), join(vscodeDest, "out"));
    await fs.copy(join(vscodeSrc, "extensions"), join(vscodeDest, "extensions"));
    await fs.copy(join(vscodeSrc, "node_modules"), join(vscodeDest, "node_modules"));
    await fs.copy(join(vscodeSrc, "package.json"), join(vscodeDest, "package.json"));

    console.log("✓ VS Code Web files copied successfully to /public/vscode");
  } catch (err) {
    console.error("Error copying VS Code Web files:", err);
    process.exit(1);
  }
}

copyVSCodeFiles(); 