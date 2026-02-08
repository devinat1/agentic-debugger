const EXTENSION_VERSION = "0.1.0";

export const handleHealth = async (_body: Record<string, unknown>): Promise<{
  status: "ok";
  extensionVersion: string;
}> => {
  return {
    status: "ok",
    extensionVersion: EXTENSION_VERSION,
  };
};
