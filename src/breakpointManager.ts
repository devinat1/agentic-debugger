import * as vscode from "vscode";
import * as path from "path";
import type { SetBreakpointsParams } from "./types";

export const setBreakpointsFromLocations = async (params: SetBreakpointsParams): Promise<{
  successCount: number;
  failedPaths: string[];
}> => {
  const { locations, workspacePath, shouldClearExisting } = params;

  if (shouldClearExisting) {
    const existingBreakpoints = vscode.debug.breakpoints;
    if (existingBreakpoints.length > 0) {
      vscode.debug.removeBreakpoints(existingBreakpoints);
    }
  }

  const breakpointsToAdd: vscode.SourceBreakpoint[] = [];
  const failedPaths: string[] = [];

  for (const location of locations) {
    const absolutePath = path.isAbsolute(location.filePath)
      ? location.filePath
      : path.join(workspacePath, location.filePath);

    const uri = vscode.Uri.file(absolutePath);

    const fileExists = await checkFileExists({ uri });
    if (!fileExists) {
      failedPaths.push(location.filePath);
      continue;
    }

    const position = new vscode.Position(location.lineNumber - 1, 0);
    const locationObject = new vscode.Location(uri, position);
    const breakpoint = new vscode.SourceBreakpoint(locationObject, true);

    breakpointsToAdd.push(breakpoint);
  }

  if (breakpointsToAdd.length > 0) {
    vscode.debug.addBreakpoints(breakpointsToAdd);
  }

  return {
    successCount: breakpointsToAdd.length,
    failedPaths,
  };
};

const checkFileExists = async (params: { uri: vscode.Uri }): Promise<boolean> => {
  const { uri } = params;

  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
};
