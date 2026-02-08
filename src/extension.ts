import * as vscode from "vscode";
import { startBridgeServer } from "./bridge/bridgeServer";
import { initializeSessionTracking } from "./debugSession/debugSessionManager";

export const activate = async (context: vscode.ExtensionContext): Promise<void> => {
  console.log("Agentic Debugger extension is now active.");

  const sessionTrackingDisposable = initializeSessionTracking();
  context.subscriptions.push(sessionTrackingDisposable);

  try {
    const bridgeDisposable = await startBridgeServer();
    context.subscriptions.push(bridgeDisposable);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Agentic Debugger: Failed to start bridge server: ${errorMessage}`);
  }
};

export const deactivate = (): void => {
  console.log("Agentic Debugger extension is now deactivated.");
};
