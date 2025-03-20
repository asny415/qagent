export function getEnv(event, key): string {
  console.log("evn", key, "return", process.env[key]);
  return process.env[key];
}
