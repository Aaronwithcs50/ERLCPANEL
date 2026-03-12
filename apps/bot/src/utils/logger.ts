type CommandErrorContext = {
  commandName: string;
  userId: string;
  origin: "slash" | "prefix";
  error: unknown;
};

const getErrorStack = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
};

export const logger = {
  error(message: string, context: Record<string, unknown>): void {
    console.error(JSON.stringify({ level: "error", message, ...context }));
  },

  commandError(message: string, context: CommandErrorContext): void {
    logger.error(message, {
      commandName: context.commandName,
      userId: context.userId,
      origin: context.origin,
      errorStack: getErrorStack(context.error),
    });
  },
};

