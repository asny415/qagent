import winston from "winston";
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "qagent.log" })],
});
export async function log(event, args) {
  logger.info(...args);
}
