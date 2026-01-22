export interface CodeLocation {
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  reason: string;
}

export interface FindRelevantCodeParams {
  featureDescription: string;
  workspacePath: string;
  apiKey?: string;
}

export interface SetBreakpointsParams {
  locations: CodeLocation[];
  workspacePath: string;
  shouldClearExisting: boolean;
}

export interface AgentExplorerResult {
  locations: CodeLocation[];
  summary: string;
}
