import * as vscode from "vscode";
import { findRelevantCode } from "./agentExplorer";
import { setBreakpointsFromLocations, openFileAtLocation } from "./breakpointManager";
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

  const setBreakpointsCommand = vscode.commands.registerCommand(
    "agenticDebugger.setBreakpoints",
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const workspacePath = workspaceFolder.uri.fsPath;

      const featureDescription = await vscode.window.showInputBox({
        prompt: "What feature are you debugging?",
        placeHolder: "e.g., email API, authentication flow, user registration",
        ignoreFocusOut: true,
      });

      if (featureDescription === undefined || featureDescription.trim().length === 0) {
        return;
      }

      const configuration = vscode.workspace.getConfiguration("agenticDebugger");
      const shouldClearExisting = configuration.get<boolean>("clearExistingBreakpoints", false);
      const apiKey = configuration.get<string>("anthropicApiKey", "");

      if (apiKey.length === 0 && !process.env["ANTHROPIC_API_KEY"]) {
        const openSettings = "Open Settings";
        const response = await vscode.window.showErrorMessage(
          "Anthropic API key not configured. Set it in extension settings or ANTHROPIC_API_KEY environment variable.",
          openSettings
        );
        if (response === openSettings) {
          vscode.commands.executeCommand("workbench.action.openSettings", "agenticDebugger.anthropicApiKey");
        }
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Agentic Debugger",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Exploring codebase with Claude..." });

          try {
            const result = await findRelevantCode({
              featureDescription: featureDescription.trim(),
              workspacePath,
              apiKey: apiKey.length > 0 ? apiKey : undefined,
            });

            if (result.locations.length === 0) {
              vscode.window.showWarningMessage(
                `No relevant code found for "${featureDescription}". ${result.summary}`
              );
              return;
            }

            progress.report({ message: "Setting breakpoints..." });

            const breakpointResult = await setBreakpointsFromLocations({
              locations: result.locations,
              workspacePath,
              shouldClearExisting,
            });

            const successMessage = `Set ${breakpointResult.successCount} breakpoint${breakpointResult.successCount === 1 ? "" : "s"} for "${featureDescription}".`;

            if (breakpointResult.failedPaths.length > 0) {
              vscode.window.showWarningMessage(
                `${successMessage} ${breakpointResult.failedPaths.length} file(s) not found.`
              );
            } else {
              vscode.window.showInformationMessage(successMessage);
            }

            const firstLocation = result.locations[0];
            if (firstLocation !== undefined) {
              await openFileAtLocation({
                location: firstLocation,
                workspacePath,
              });
            }

            logBreakpointSummary({
              featureDescription,
              result,
              breakpointResult,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to set breakpoints: ${errorMessage}`);
            console.error(`Agentic Debugger error: ${errorMessage}`);
          }
        }
      );
    }
  );

  context.subscriptions.push(setBreakpointsCommand);
};

const logBreakpointSummary = (params: {
  featureDescription: string;
  result: { locations: { filePath: string; lineNumber: number; reason: string }[]; summary: string };
  breakpointResult: { successCount: number; failedPaths: string[] };
}): void => {
  const { featureDescription, result, breakpointResult } = params;

  console.log(`Agentic Debugger: Set breakpoints for "${featureDescription}".`);
  console.log(`Summary: ${result.summary}`);
  console.log(`Breakpoints set: ${breakpointResult.successCount}`);

  result.locations.forEach((location, index) => {
    console.log(`  ${index + 1}. ${location.filePath}:${location.lineNumber} - ${location.reason}`);
  });

  if (breakpointResult.failedPaths.length > 0) {
    console.log(`Files not found: ${breakpointResult.failedPaths.join(", ")}`);
  }
};

export const deactivate = (): void => {
  console.log("Agentic Debugger extension is now deactivated.");
};
