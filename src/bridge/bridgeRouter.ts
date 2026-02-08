import type * as http from "http";
import { handleHealth } from "../handlers/healthHandler";
import {
  handleSetBreakpoints,
  handleRemoveBreakpoints,
  handleListBreakpoints,
} from "../handlers/breakpointHandlers";
import {
  handleStartDebugSession,
  handleStopDebugSession,
  handleStepOver,
  handleStepInto,
  handleStepOut,
  handleContinueExecution,
  handleGetVariables,
  handleGetCallStack,
  handleEvaluateExpression,
} from "../handlers/debugSessionHandlers";

interface RouteHandler {
  method: "GET" | "POST";
  handler: (body: Record<string, unknown>) => Promise<unknown>;
}

const routes: Record<string, RouteHandler> = {
  "/api/health": { method: "GET", handler: handleHealth },
  "/api/setBreakpoints": { method: "POST", handler: handleSetBreakpoints },
  "/api/removeBreakpoints": { method: "POST", handler: handleRemoveBreakpoints },
  "/api/listBreakpoints": { method: "POST", handler: handleListBreakpoints },
  "/api/startDebugSession": { method: "POST", handler: handleStartDebugSession },
  "/api/stopDebugSession": { method: "POST", handler: handleStopDebugSession },
  "/api/stepOver": { method: "POST", handler: handleStepOver },
  "/api/stepInto": { method: "POST", handler: handleStepInto },
  "/api/stepOut": { method: "POST", handler: handleStepOut },
  "/api/continueExecution": { method: "POST", handler: handleContinueExecution },
  "/api/getVariables": { method: "POST", handler: handleGetVariables },
  "/api/getCallStack": { method: "POST", handler: handleGetCallStack },
  "/api/evaluateExpression": { method: "POST", handler: handleEvaluateExpression },
};

const parseJsonBody = (params: { request: http.IncomingMessage }): Promise<Record<string, unknown>> => {
  const { request } = params;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (raw.length === 0) {
        resolve({});
        return;
      }
      try {
        const parsed: unknown = JSON.parse(raw);
        resolve((typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    request.on("error", reject);
  });
};

const sendJsonResponse = (params: {
  response: http.ServerResponse;
  statusCode: number;
  data: unknown;
}): void => {
  const { response, statusCode, data } = params;
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
};

export const routeRequest = async (params: {
  request: http.IncomingMessage;
  response: http.ServerResponse;
}): Promise<void> => {
  const { request, response } = params;
  const url = request.url ?? "/";
  const method = (request.method ?? "GET").toUpperCase();

  const route = routes[url];
  if (route === undefined) {
    sendJsonResponse({ response, statusCode: 404, data: { error: `Route not found: ${url}` } });
    return;
  }

  if (method !== route.method && !(method === "POST" && route.method === "GET")) {
    sendJsonResponse({ response, statusCode: 405, data: { error: `Method not allowed: ${method}` } });
    return;
  }

  try {
    const body = method === "POST" ? await parseJsonBody({ request }) : {};
    const result = await route.handler(body);
    sendJsonResponse({ response, statusCode: 200, data: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Agentic Debugger bridge error on ${url}: ${errorMessage}`);
    sendJsonResponse({ response, statusCode: 500, data: { error: errorMessage } });
  }
};
