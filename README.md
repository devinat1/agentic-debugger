# Agentic Debugger

AI-powered breakpoint placement for VS Code using the Claude Agent SDK.

Describe a feature in plain English, and the AI agent explores your codebase to automatically set breakpoints at relevant locations.

## Features

- **Natural language breakpoint placement** - Describe what you want to debug (e.g., "user authentication", "email sending", "payment processing")
- **Intelligent code exploration** - Claude agent analyzes your codebase structure, searches for relevant files, and identifies key debugging points
- **Automatic breakpoint setting** - Breakpoints are placed at entry points, core logic, data transformations, and error handling paths

## Installation

1. Install the extension from Open VSX or VS Code Marketplace
2. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
3. Configure the API key in extension settings

## Configuration

Open VS Code Settings and search for "Agentic Debugger":

| Setting | Description |
|---------|-------------|
| `agenticDebugger.anthropicApiKey` | Your Anthropic API key |
| `agenticDebugger.clearExistingBreakpoints` | Clear existing breakpoints before setting new ones (default: false) |

Alternatively, set the `ANTHROPIC_API_KEY` environment variable.

## Usage

1. Open a workspace/folder containing your code
2. Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux)
3. Enter a feature description (e.g., "login flow", "database queries", "API endpoints")
4. Wait for the agent to explore your codebase
5. Breakpoints are automatically set and the first relevant file opens

You can also use the Command Palette: **Agentic Debugger: Set Breakpoints for Feature**

## How It Works

1. You describe what you want to debug
2. The Claude agent uses Glob, Grep, and Read tools to explore your codebase
3. It identifies relevant locations based on:
   - Entry points (API routes, event handlers, main functions)
   - Core logic implementation
   - Data transformations and validations
   - Error handling paths
4. Breakpoints are set at the identified line numbers

## Requirements

- VS Code 1.85.0 or higher
- Anthropic API key

## License

MIT
