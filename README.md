# Agentic Debugger

AI-powered debugging for VS Code. Set breakpoints with natural language, or give an AI agent full control of your debugger through MCP.

## Features

- **Natural language breakpoint placement** - Describe what you want to debug (e.g., "user authentication", "email sending", "payment processing") and breakpoints are set automatically
- **Intelligent code exploration** - Claude agent analyzes your codebase structure, searches for relevant files, and identifies key debugging points
- **MCP bridge for AI agents** - Exposes VS Code's debug capabilities over HTTP, allowing AI agents to control the debugger via the [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server)

## Architecture

The extension works in two modes:

**Standalone** - Use the built-in command to set breakpoints with natural language. Requires an Anthropic API key.

**With MCP Server** - For full interactive debugging (stepping, inspecting variables, evaluating expressions), pair this extension with the [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server). The extension runs an HTTP bridge server that the MCP server connects to, exposing 13 debugging tools to any MCP-compatible AI agent.

```
AI Agent (Claude, etc.)
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
2. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
3. Configure the API key in extension settings

To enable MCP-powered debugging, also install the [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server).

## Configuration

Open VS Code Settings and search for "Agentic Debugger":

| Setting | Description |
|---------|-------------|
| `agenticDebugger.anthropicApiKey` | Your Anthropic API key |
| `agenticDebugger.clearExistingBreakpoints` | Clear existing breakpoints before setting new ones (default: false) |
| `agenticDebugger.bridgePort` | Port for the bridge HTTP server used by MCP clients (default: 7070) |

Alternatively, set the `ANTHROPIC_API_KEY` environment variable.

## Usage

### Standalone: Natural Language Breakpoints

1. Open a workspace/folder containing your code
2. Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux)
3. Enter a feature description (e.g., "login flow", "database queries", "API endpoints")
4. Wait for the agent to explore your codebase
5. Breakpoints are automatically set and the first relevant file opens

You can also use the Command Palette: **Agentic Debugger: Set Breakpoints for Feature**

### With MCP Server: Full AI Debugging

1. Start the [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server)
2. Connect your AI agent (e.g., Claude) to the MCP server
3. The agent can now set breakpoints, start/stop debug sessions, step through code, inspect variables, evaluate expressions, and view the call stack

Available MCP tools: `set_breakpoints`, `remove_breakpoints`, `list_breakpoints`, `start_debug_session`, `stop_debug_session`, `step_over`, `step_into`, `step_out`, `continue_execution`, `get_variables`, `get_call_stack`, `evaluate_expression`, `analyze_code`

## How It Works

1. You describe what you want to debug
2. The Claude agent uses Glob, Grep, and Read tools to explore your codebase
3. It identifies relevant locations based on:
   - Entry points (API routes, event handlers, main functions)
   - Core logic implementation
   - Data transformations and validations
   - Error handling paths
4. Breakpoints are set at the identified line numbers

When using the MCP server, the AI agent has full control of the debug lifecycle — it can start sessions, step through execution, inspect state, and make decisions about where to investigate next.

## Requirements

- VS Code 1.85.0 or higher
- Anthropic API key (for standalone breakpoint placement)
- [Debugger MCP Server](https://github.com/devinat1/debugger-mcp-server) (optional, for full AI debugging)

## License

MIT
