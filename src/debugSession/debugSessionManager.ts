import * as vscode from "vscode";

const activeSessions = new Map<string, vscode.DebugSession>();

const SESSION_START_TIMEOUT_MS = 30000;

export const initializeSessionTracking = (): vscode.Disposable => {
  const terminateDisposable = vscode.debug.onDidTerminateDebugSession((session) => {
    activeSessions.delete(session.id);
    console.log(`Agentic Debugger: Debug session "${session.name}" (${session.id}) terminated.`);
  });

  const startDisposable = vscode.debug.onDidStartDebugSession((session) => {
    activeSessions.set(session.id, session);
    console.log(`Agentic Debugger: Debug session "${session.name}" (${session.id}) started.`);
  });

  return new vscode.Disposable(() => {
    terminateDisposable.dispose();
    startDisposable.dispose();
    activeSessions.clear();
  });
};

export const startSession = async (params: {
  type: string;
  name: string;
  request: "launch" | "attach";
  program?: string;
  args?: string[];
  cwd?: string;
  additionalConfig?: Record<string, unknown>;
}): Promise<{ sessionId: string; name: string }> => {
  const { type, name, request, program, args, cwd, additionalConfig } = params;

  const folder = vscode.workspace.workspaceFolders?.[0];

  const config: vscode.DebugConfiguration = {
    type,
    name,
    request,
    ...(program !== undefined ? { program } : {}),
    ...(args !== undefined ? { args } : {}),
    ...(cwd !== undefined ? { cwd } : {}),
    ...(additionalConfig !== undefined ? additionalConfig : {}),
  };

  const sessionPromise = new Promise<vscode.DebugSession>((resolve, reject) => {
    const timeout = setTimeout(() => {
      disposable.dispose();
      reject(new Error("Debug session start timed out."));
    }, SESSION_START_TIMEOUT_MS);

    const disposable = vscode.debug.onDidStartDebugSession((session) => {
      clearTimeout(timeout);
      disposable.dispose();
      resolve(session);
    });
  });

  const started = await vscode.debug.startDebugging(folder, config);
  if (!started) {
    throw new Error("Failed to start debug session.");
  }

  const session = await sessionPromise;
  return { sessionId: session.id, name: session.name };
};

export const stopSession = async (params: { sessionId?: string }): Promise<{ stopped: boolean }> => {
  const { sessionId } = params;

  if (sessionId !== undefined) {
    const session = activeSessions.get(sessionId);
    if (session === undefined) {
      throw new Error(`No active debug session found with id "${sessionId}".`);
    }
    await vscode.debug.stopDebugging(session);
    return { stopped: true };
  }

  const activeSession = vscode.debug.activeDebugSession;
  if (activeSession === undefined) {
    throw new Error("No active debug session to stop.");
  }
  await vscode.debug.stopDebugging(activeSession);
  return { stopped: true };
};

export const getActiveSession = (params: { sessionId?: string }): vscode.DebugSession => {
  const { sessionId } = params;

  if (sessionId !== undefined) {
    const session = activeSessions.get(sessionId);
    if (session === undefined) {
      throw new Error(`No active debug session found with id "${sessionId}".`);
    }
    return session;
  }

  const activeSession = vscode.debug.activeDebugSession;
  if (activeSession === undefined) {
    throw new Error("No active debug session found.");
  }
  return activeSession;
};

export const resolveThreadId = async (params: {
  session: vscode.DebugSession;
  threadId?: number;
}): Promise<number> => {
  const { session, threadId } = params;

  if (threadId !== undefined) {
    return threadId;
  }

  const threadsResponse = await session.customRequest("threads", {}) as { threads: Array<{ id: number }> };
  const firstThread = threadsResponse.threads[0];
  if (firstThread === undefined) {
    throw new Error("No threads available in the debug session.");
  }
  return firstThread.id;
};
