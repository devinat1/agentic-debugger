import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const PORT_FILE_DIR = path.join(os.homedir(), ".agentic-debugger");
const PORT_FILE_PATH = path.join(PORT_FILE_DIR, "bridge-port");

export const writePortFile = (params: { port: number }): void => {
  const { port } = params;

  if (!fs.existsSync(PORT_FILE_DIR)) {
    fs.mkdirSync(PORT_FILE_DIR, { recursive: true });
  }
  fs.writeFileSync(PORT_FILE_PATH, String(port), "utf-8");
  console.log(`Agentic Debugger: Wrote bridge port ${port} to ${PORT_FILE_PATH}.`);
};

export const removePortFile = (): void => {
  try {
    fs.unlinkSync(PORT_FILE_PATH);
    console.log("Agentic Debugger: Removed bridge port file.");
  } catch {
    // Port file may not exist, which is fine.
  }
};
