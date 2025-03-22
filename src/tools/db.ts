import { BrowserLevel } from "browser-level";
const db = new BrowserLevel("qagent");

export const dbPut_doc: DOC = [
  "数据库的put操作",
  [
    ["key", "string", "存储的键"],
    ["value", "string", "存储的值"],
  ],
];
export const dbPut: TOOL_FUNCTION = async (args) => {
  const { key, value } = args;
  await db.put(key, value);
  return "success";
};

export const dbGet_doc: DOC = [
  "数据库的get操作",
  [["key", "string", "存储的键"]],
];
export const dbGet: TOOL_FUNCTION = async (args) => {
  const { key } = args;
  return await db.get(key);
};
