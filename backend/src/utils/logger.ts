import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: {},
  transports: [
    new winston.transports.File({
      filename: "./logs/error.log",
      level: "error",
    }),
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    new winston.transports.File({ filename: "./logs/combined.log" }),
  ],
});

// Log to the console as well when in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
