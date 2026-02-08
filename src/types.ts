export interface CodeLocation {
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  reason: string;
}

export interface SetBreakpointsParams {
  locations: CodeLocation[];
  workspacePath: string;
  shouldClearExisting: boolean;
}
