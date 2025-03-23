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

export const dbDel_doc: DOC = [
  "数据库的del操作",
  [["key", "string", "存储的键"]],
];
export const dbDel: TOOL_FUNCTION = async (args) => {
  const { key } = args;
  await db.del(key);
  return "success";
};

export const listPrefix_doc: DOC = [
  "数据库操作，列举所有以prefix开头的键值对",
  [["prefix", "string", "前缀"]],
];
export const listPrefix: TOOL_FUNCTION = async (args) => {
  const kvs = [];
  const prefix = args.prefix;

  // 创建范围查询流：gte >= prefix, lt < prefix + '\xff'
  const stream = db.iterator({
    gt: prefix,
    lt: prefix + "\xff", // \xff 确保范围不超过prefix的扩展
    keys: true, // 返回 keys
    values: true, // 不需要返回值
  });

  // 流数据事件处理
  for await (const data of stream) {
    kvs.push(data);
  }

  return kvs;
};

window.qdb = {
  dbGet,
  dbPut,
  dbDel,
  listPrefix,
};
