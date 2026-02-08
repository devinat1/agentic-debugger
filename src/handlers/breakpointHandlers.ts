import * as vscode from "vscode";
import { setBreakpointsFromLocations } from "../breakpointManager";
import type { CodeLocation } from "../types";

const validateLocationsArray = (params: { value: unknown }): Array<{
  filePath: string;
  lineNumber: number;
  condition?: string;
  logMessage?: string;
}> => {
  const { value } = params;

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Locations array is required and must not be empty.");
  }

  return value.filter((item): item is Record<string, unknown> =>
    typeof item === "object" && item !== null
  ).filter((item) =>
    typeof item["filePath"] === "string" && typeof item["lineNumber"] === "number"
  ).map((item) => ({
    filePath: item["filePath"] as string,
    lineNumber: item["lineNumber"] as number,
    ...(typeof item["condition"] === "string" ? { condition: item["condition"] } : {}),
    ...(typeof item["logMessage"] === "string" ? { logMessage: item["logMessage"] } : {}),
  }));
};

export const handleSetBreakpoints = async (body: Record<string, unknown>): Promise<{
  successCount: number;
  failedPaths: string[];
}> => {
  const locations = validateLocationsArray({ value: body["locations"] });
  const shouldClearExisting = body["shouldClearExisting"] === true;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder === undefined) {
    throw new Error("No workspace folder is open.");
  }
  const workspacePath = workspaceFolder.uri.fsPath;

  const codeLocations: CodeLocation[] = locations.map((location) => ({
    filePath: location.filePath,
    lineNumber: location.lineNumber,
    codeSnippet: "",
    reason: "",
  }));

  const result = await setBreakpointsFromLocations({
    locations: codeLocations,
    workspacePath,
    shouldClearExisting,
  });

  return result;
};

export const handleRemoveBreakpoints = async (body: Record<string, unknown>): Promise<{
  removedCount: number;
}> => {
  const rawIds = body["breakpointIds"];
  const breakpointIds = Array.isArray(rawIds)
    ? rawIds.filter((id): id is string => typeof id === "string")
    : undefined;

  const existingBreakpoints = vscode.debug.breakpoints;

  if (breakpointIds === undefined || breakpointIds.length === 0) {
    const count = existingBreakpoints.length;
    vscode.debug.removeBreakpoints(existingBreakpoints);
    return { removedCount: count };
  }

  const breakpointIdSet = new Set(breakpointIds);
  const breakpointsToRemove = existingBreakpoints.filter((breakpoint) =>
    breakpointIdSet.has(breakpoint.id)
  );

  vscode.debug.removeBreakpoints(breakpointsToRemove);
  return { removedCount: breakpointsToRemove.length };
};

export const handleListBreakpoints = async (_body: Record<string, unknown>): Promise<{
  breakpoints: Array<{
    id: string;
    enabled: boolean;
    location?: { filePath: string; lineNumber: number };
    condition?: string;
    hitCondition?: string;
    logMessage?: string;
  }>;
}> => {
  const existingBreakpoints = vscode.debug.breakpoints;

  const breakpoints = existingBreakpoints.map((breakpoint) => {
    const isSourceBreakpoint = breakpoint instanceof vscode.SourceBreakpoint;
    const sourceBreakpoint = isSourceBreakpoint ? breakpoint : undefined;

    const location = sourceBreakpoint !== undefined
      ? {
          filePath: sourceBreakpoint.location.uri.fsPath,
          lineNumber: sourceBreakpoint.location.range.start.line + 1,
        }
      : undefined;

    return {
      id: breakpoint.id,
      enabled: breakpoint.enabled,
      ...(location !== undefined ? { location } : {}),
      ...(breakpoint.condition !== undefined ? { condition: breakpoint.condition } : {}),
      ...(breakpoint.hitCondition !== undefined ? { hitCondition: breakpoint.hitCondition } : {}),
      ...(breakpoint.logMessage !== undefined ? { logMessage: breakpoint.logMessage } : {}),
    };
  });

  return { breakpoints };
};
