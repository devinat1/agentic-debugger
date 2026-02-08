import * as http from "http";
import * as vscode from "vscode";
import { writePortFile, removePortFile } from "./portFile";
import { routeRequest } from "./bridgeRouter";

const DEFAULT_PORT = 7070;

const listenOnPort = (params: { server: http.Server; port: number; host: string }): Promise<number> => {
  const { server, port, host } = params;

  return new Promise<number>((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      server.removeListener("error", onError);
      reject(error);
    };

    server.on("error", onError);

    server.listen(port, host, () => {
      server.removeListener("error", onError);
      const address = server.address();
      if (address !== null && typeof address === "object") {
        resolve(address.port);
      } else {
        reject(new Error("Failed to get server address."));
      }
    });
  });
};

export const startBridgeServer = async (): Promise<vscode.Disposable> => {
  const configuration = vscode.workspace.getConfiguration("agenticDebugger");
  const configuredPort = configuration.get<number>("bridgePort", DEFAULT_PORT);
  const host = "127.0.0.1";

  const server = http.createServer(async (request, response) => {
    await routeRequest({ request, response });
  });

  const actualPort = await (async () => {
    try {
      return await listenOnPort({ server, port: configuredPort, host });
    } catch (error) {
      const errorWithCode = error as NodeJS.ErrnoException;
      if (errorWithCode.code === "EADDRINUSE") {
        console.log(`Agentic Debugger: Port ${configuredPort} in use, trying OS-assigned port.`);
        return await listenOnPort({ server, port: 0, host });
      }
      throw error;
    }
  })();

  writePortFile({ port: actualPort });
  console.log(`Agentic Debugger: Bridge server listening on ${host}:${actualPort}.`);

  const disposable = new vscode.Disposable(() => {
    server.close();
    removePortFile();
    console.log("Agentic Debugger: Bridge server stopped.");
  });

  return disposable;
};
