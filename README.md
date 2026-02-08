# Agentic Debugger

A VS Code extension that bridges AI agents to VS Code's built-in debugger. It runs an HTTP server inside the extension host, allowing the [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server) to control breakpoints, stepping, variable inspection, and more.

## Architecture

```
AI Agent (Claude, Cursor, etc.)
    │ MCP Protocol
    ▼
Debugger MCP Server (:6090)
    │ HTTP
    ▼
Agentic Debugger Extension (:7070)
    │ VS Code Debug API
    ▼
VS Code Debugger (DAP)
```

## Installation

1. Install the extension from [Open VSX](https://open-vsx.org/extension/devinat1/agentic-debugger)
2. Add the MCP server to your client configuration:

**Claude Code:**

```bash
claude mcp add debugger --scope user -- npx debugger-mcp-server
```

**Claude Desktop, Cursor, or other MCP clients:**

```json
{
  "mcpServers": {
    "debugger": {
      "command": "npx",
      "args": ["debugger-mcp-server"]
    }
  }
}
```

## Available MCP Tools

| Category | Tool | Description |
|---|---|---|
| Breakpoints | `setBreakpoints` | Set breakpoints in a file |
| Breakpoints | `removeBreakpoints` | Remove breakpoints |
| Breakpoints | `listBreakpoints` | List all active breakpoints |
| Debug Session | `startDebugSession` | Launch a debug session |
| Debug Session | `stopDebugSession` | Stop the active debug session |
| Debug Session | `stepOver` | Step over the current line |
| Debug Session | `stepInto` | Step into a function call |
| Debug Session | `stepOut` | Step out of the current function |
| Debug Session | `continueExecution` | Continue execution to next breakpoint |
| Debug Session | `getVariables` | Inspect variables in current scope |
| Debug Session | `getCallStack` | View the call stack |
| Debug Session | `evaluateExpression` | Evaluate an expression in the debug context |

## Configuration

| Setting | Description |
|---------|-------------|
| `agenticDebugger.bridgePort` | Port for the bridge HTTP server (default: 7070) |

## Requirements

- VS Code 1.85.0 or higher
- [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server)

## License

MIT
