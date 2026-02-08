import * as vscode from "vscode";
import { findRelevantCode } from "../agentExplorer";

export const handleAnalyzeCode = async (body: Record<string, unknown>): Promise<{
  locations: Array<{
    filePath: string;
    lineNumber: number;
    codeSnippet: string;
    reason: string;
  }>;
  summary: string;
}> => {
  const featureDescription = body["featureDescription"] as string | undefined;
  const workspacePath = body["workspacePath"] as string | undefined;

  if (featureDescription === undefined || featureDescription.length === 0) {
    throw new Error("Field 'featureDescription' is required.");
  }

  const resolvedWorkspacePath = workspacePath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (resolvedWorkspacePath === undefined) {
    throw new Error("No workspace path provided and no workspace folder is open.");
  }

  const configuration = vscode.workspace.getConfiguration("agenticDebugger");
  const apiKey = configuration.get<string>("anthropicApiKey", "");

  const result = await findRelevantCode({
    featureDescription,
    workspacePath: resolvedWorkspacePath,
    apiKey: apiKey.length > 0 ? apiKey : undefined,
  });

  return result;
};
