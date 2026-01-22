import { query } from "@anthropic-ai/claude-agent-sdk";
import type { CodeLocation, FindRelevantCodeParams, AgentExplorerResult } from "./types";

const SYSTEM_PROMPT = `You are a code exploration assistant. Your task is to find the most relevant code locations for debugging a specific feature.

When searching, focus on:
1. Entry points (API routes, event handlers, main functions)
2. Core logic implementation
3. Data transformations and validations
4. Error handling paths

For each relevant location you find, provide:
- The exact file path
- The exact line number
- A brief code snippet
- Why this location is relevant for debugging

Return your findings as a JSON object with this structure:
{
  "locations": [
    {
      "filePath": "src/path/to/file.ts",
      "lineNumber": 42,
      "codeSnippet": "const result = await processData(input);",
      "reason": "This is where the data processing begins"
    }
  ],
  "summary": "Brief explanation of the code flow"
}

Only return the JSON object, no additional text.`;

export const findRelevantCode = async (params: {
  featureDescription: string;
  workspacePath: string;
  apiKey?: string;
}): Promise<AgentExplorerResult> => {
  const { featureDescription, workspacePath, apiKey } = params;

  const userPrompt = `Search this codebase for code related to: "${featureDescription}".
Find the most important entry points, core logic, and key functions that would be useful for debugging this feature.
Return your findings as JSON with file paths and line numbers.`;

  const defaultResult: AgentExplorerResult = {
    locations: [],
    summary: "No relevant code found.",
  };

  try {
    const resultTexts: string[] = [];

    console.log(`Agentic Debugger: Starting agent query for "${featureDescription}" in ${workspacePath}`);

    if (apiKey !== undefined && apiKey.length > 0) {
      process.env["ANTHROPIC_API_KEY"] = apiKey;
    }

    for await (const message of query({
      prompt: userPrompt,
      options: {
        cwd: workspacePath,
        systemPrompt: SYSTEM_PROMPT,
        allowedTools: ["Read", "Glob", "Grep"],
        permissionMode: "bypassPermissions",
        maxTurns: 25,
      },
    })) {
      console.log(`Agentic Debugger: Received message type="${message.type}"`);

      if (message.type === "result") {
        console.log(`Agentic Debugger: Result message - subtype="${message.subtype}"`);
        if (message.subtype === "success") {
          console.log(`Agentic Debugger: Success result="${message.result}"`);
          resultTexts.push(message.result);
        } else {
          console.error(`Agentic Debugger: Agent ended with subtype="${message.subtype}" - ${JSON.stringify(message)}`);
        }
      }
    }

    const resultText = resultTexts[resultTexts.length - 1] ?? "";
    console.log(`Agentic Debugger: Final result text length: ${resultText.length}`);

    if (resultText.length === 0) {
      console.warn("Agentic Debugger: No result text received from agent.");
      return defaultResult;
    }

    const parsed = parseAgentResponse({ responseText: resultText });
    console.log(`Agentic Debugger: Parsed ${parsed.locations.length} locations.`);
    return parsed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error(`Failed to explore codebase: ${errorMessage}`);
    console.error(`Stack trace: ${errorStack}`);
    return {
      ...defaultResult,
      summary: `Error: ${errorMessage}`,
    };
  }
};

const parseAgentResponse = (params: {
  responseText: string;
}): AgentExplorerResult => {
  const { responseText } = params;

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      locations: extractLocationsFromText({ text: responseText }),
      summary: "Extracted locations from agent response.",
    };
  }

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    const validatedLocations = validateAndExtractLocations({ parsed });
    const validatedSummary = validateAndExtractSummary({ parsed });
    return {
      locations: validatedLocations,
      summary: validatedSummary,
    };
  } catch {
    return {
      locations: extractLocationsFromText({ text: responseText }),
      summary: "Failed to parse JSON, extracted locations from text.",
    };
  }
};

const validateAndExtractLocations = (params: { parsed: unknown }): CodeLocation[] => {
  const { parsed } = params;

  if (typeof parsed !== "object" || parsed === null) {
    return [];
  }

  const parsedObject = parsed as Record<string, unknown>;
  const locations = parsedObject["locations"];

  if (!Array.isArray(locations)) {
    return [];
  }

  return locations
    .filter((item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null
    )
    .filter((item) =>
      typeof item["filePath"] === "string" &&
      typeof item["lineNumber"] === "number"
    )
    .map((item) => ({
      filePath: item["filePath"] as string,
      lineNumber: item["lineNumber"] as number,
      codeSnippet: typeof item["codeSnippet"] === "string" ? item["codeSnippet"] : "",
      reason: typeof item["reason"] === "string" ? item["reason"] : "No reason provided.",
    }));
};

const validateAndExtractSummary = (params: { parsed: unknown }): string => {
  const { parsed } = params;

  if (typeof parsed !== "object" || parsed === null) {
    return "No summary provided.";
  }

  const parsedObject = parsed as Record<string, unknown>;
  const summary = parsedObject["summary"];

  return typeof summary === "string" ? summary : "No summary provided.";
};

const extractLocationsFromText = (params: { text: string }): CodeLocation[] => {
  const { text } = params;

  const fileLinePattern = /([a-zA-Z0-9_\-./]+\.(?:ts|js|tsx|jsx)):(\d+)/g;
  const matches = Array.from(text.matchAll(fileLinePattern));

  const uniqueLocations = new Map<string, CodeLocation>();

  matches.forEach((match) => {
    const filePath = match[1];
    const lineNumberString = match[2];

    if (filePath === undefined || lineNumberString === undefined) {
      return;
    }

    const lineNumber = parseInt(lineNumberString, 10);
    const key = `${filePath}:${lineNumber}`;

    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, {
        filePath,
        lineNumber,
        codeSnippet: "",
        reason: "Extracted from agent response.",
      });
    }
  });

  return Array.from(uniqueLocations.values());
};
