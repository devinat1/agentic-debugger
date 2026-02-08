import {
  startSession,
  stopSession,
  getActiveSession,
  resolveThreadId,
} from "../debugSession/debugSessionManager";

const validateString = (params: { value: unknown; fieldName: string }): string => {
  const { value, fieldName } = params;
  if (typeof value !== "string") {
    throw new Error(`Field '${fieldName}' must be a string.`);
  }
  return value;
};

const validateOptionalString = (params: { value: unknown }): string | undefined => {
  const { value } = params;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  return value;
};

const validateOptionalNumber = (params: { value: unknown }): number | undefined => {
  const { value } = params;
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number") {
    return undefined;
  }
  return value;
};

export const handleStartDebugSession = async (body: Record<string, unknown>): Promise<{
  sessionId: string;
  name: string;
}> => {
  const type = validateString({ value: body["type"], fieldName: "type" });
  const name = validateString({ value: body["name"], fieldName: "name" });
  const requestValue = validateString({ value: body["request"], fieldName: "request" });

  if (requestValue !== "launch" && requestValue !== "attach") {
    throw new Error("Field 'request' must be 'launch' or 'attach'.");
  }

  return startSession({
    type,
    name,
    request: requestValue,
    program: validateOptionalString({ value: body["program"] }),
    args: Array.isArray(body["args"]) ? body["args"] as string[] : undefined,
    cwd: validateOptionalString({ value: body["cwd"] }),
    additionalConfig: (typeof body["additionalConfig"] === "object" && body["additionalConfig"] !== null)
      ? body["additionalConfig"] as Record<string, unknown>
      : undefined,
  });
};

export const handleStopDebugSession = async (body: Record<string, unknown>): Promise<{
  stopped: boolean;
}> => {
  return stopSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
};

export const handleStepOver = async (body: Record<string, unknown>): Promise<{ success: boolean }> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });
  await session.customRequest("next", { threadId });
  return { success: true };
};

export const handleStepInto = async (body: Record<string, unknown>): Promise<{ success: boolean }> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });
  await session.customRequest("stepIn", { threadId });
  return { success: true };
};

export const handleStepOut = async (body: Record<string, unknown>): Promise<{ success: boolean }> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });
  await session.customRequest("stepOut", { threadId });
  return { success: true };
};

export const handleContinueExecution = async (body: Record<string, unknown>): Promise<{ success: boolean }> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });
  await session.customRequest("continue", { threadId });
  return { success: true };
};

export const handleGetVariables = async (body: Record<string, unknown>): Promise<{
  variables: unknown[];
}> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const variablesReference = validateOptionalNumber({ value: body["variablesReference"] });

  if (variablesReference !== undefined) {
    const variablesResponse = await session.customRequest("variables", { variablesReference }) as {
      variables: unknown[];
    };
    return { variables: variablesResponse.variables };
  }

  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });

  const stackResponse = await session.customRequest("stackTrace", { threadId }) as {
    stackFrames: Array<{ id: number }>;
  };

  const topFrame = stackResponse.stackFrames[0];
  if (topFrame === undefined) {
    return { variables: [] };
  }

  const frameId = (validateOptionalNumber({ value: body["frameId"] })) ?? topFrame.id;

  const scopesResponse = await session.customRequest("scopes", { frameId }) as {
    scopes: Array<{ variablesReference: number; name: string }>;
  };

  const allVariables = await Promise.all(
    scopesResponse.scopes.map(async (scope) => {
      const variablesResponse = await session.customRequest("variables", {
        variablesReference: scope.variablesReference,
      }) as { variables: unknown[] };
      return { scope: scope.name, variables: variablesResponse.variables };
    })
  );

  return { variables: allVariables };
};

export const handleGetCallStack = async (body: Record<string, unknown>): Promise<{
  stackFrames: unknown[];
}> => {
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const threadId = await resolveThreadId({
    session,
    threadId: validateOptionalNumber({ value: body["threadId"] }),
  });

  const stackResponse = await session.customRequest("stackTrace", { threadId }) as {
    stackFrames: unknown[];
  };
  return { stackFrames: stackResponse.stackFrames };
};

export const handleEvaluateExpression = async (body: Record<string, unknown>): Promise<{
  result: string;
  type?: string;
  variablesReference?: number;
}> => {
  const expression = validateString({ value: body["expression"], fieldName: "expression" });
  const session = getActiveSession({ sessionId: validateOptionalString({ value: body["sessionId"] }) });
  const context = validateOptionalString({ value: body["context"] }) ?? "repl";
  const frameId = validateOptionalNumber({ value: body["frameId"] });

  const evaluateArgs: Record<string, unknown> = {
    expression,
    context,
    ...(frameId !== undefined ? { frameId } : {}),
  };

  const evaluateResponse = await session.customRequest("evaluate", evaluateArgs) as {
    result: string;
    type?: string;
    variablesReference?: number;
  };

  return {
    result: evaluateResponse.result,
    ...(evaluateResponse.type !== undefined ? { type: evaluateResponse.type } : {}),
    ...(evaluateResponse.variablesReference !== undefined && evaluateResponse.variablesReference > 0
      ? { variablesReference: evaluateResponse.variablesReference }
      : {}),
  };
};
