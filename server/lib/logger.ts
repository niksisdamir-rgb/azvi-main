import pino from "pino";

// Define the transport for pretty logging in development, standard JSON otherwise
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export default logger;

export const dbLogger = logger.child({ module: "db" });
export const authLogger = logger.child({ module: "auth" });
export const redisLogger = logger.child({ module: "redis" });
export const emailLogger = logger.child({ module: "email" });
export const smsLogger = logger.child({ module: "sms" });
export const jobsLogger = logger.child({ module: "jobs" });
