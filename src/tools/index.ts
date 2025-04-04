import * as toolset from "./toolset";
import { DOC, ProgressCB, toPyType } from "./common";
import { log } from "../ElectronWindow";

const tools = Object.keys(toolset)
  .filter((f) => !f.endsWith("_doc"))
  .map((f) => [toolset, f]);

function tooldDoc([module, fname]): string {
  // eslint-disable-next-line import/namespace
  const doc = module[`${fname}_doc`] as DOC;

  const args = (doc[1] || [])
    .map((arg) => `${arg[0]}:${toPyType(arg[1])}`)
    .join(",");
  return `def ${fname}(${args}) -> str:
"""${doc[0]}

Args:
  ${(doc[1] || []).map((arg) => `${arg[0]}:${arg[2]}`).join("\n")}
"""
`;
}

//python格式的工具箱文档
export function toolsDoc(): string {
  return tools.map((t) => tooldDoc(t)).join("\n\n");
}

//检查第一个匹配的函数，如果匹配则运行并返回结果，否则返回false
export async function toolGo(rsp: string, cb: ProgressCB): string | boolean {
  const toolcode_reg = /```tool_code\n(?:print\()?(.*)(?:\))?\n```/s;
  if (rsp.match(toolcode_reg)) {
    cb("thinking");
    let code = rsp.match(toolcode_reg)[1];
    if (code.endsWith("))")) {
      code = code.slice(0, -1);
    }
    console.log("找到需要运行的代码:", code);
    for (const tool of tools) {
      const [module, fname] = tool;
      console.log("test tool", fname);
      const args = (module[`${fname}_doc`] as DOC)[1];
      const argsReg = (args || [])
        .map(
          (
            arg,
            idx //如果前面的参数都不要太饥饿，最后一个参数可以饥饿一点，所以只有一个字符串且放到最后
          ) =>
            `(?:${arg[0]}=)?['"]?(.*${idx < args.length - 1 ? "?" : ""})['"]?`
        )
        .join("\\s*,\\s*");
      const funcreg = `^${fname}\\(${argsReg}\\)`;
      console.log(funcreg);
      const reg = new RegExp(funcreg);
      if (code.match(reg)) {
        const params = code.match(reg).slice(1, 1 + (args || []).length);
        console.log("need run code", code.match(reg), params);
        const result = await module[fname](
          params.reduce((r, v, idx) => {
            let value = v;
            if (value.endsWith('"') || value.endsWith("'")) {
              value = value.slice(0, -1);
            }
            if (args[idx][1] == "number") value = Number(v);
            if (args[idx][1] == "int") value = Number(v);
            if (args[idx][1] == "boolean") value = Boolean(v);
            r[args[idx][0]] = value;
            return r;
          }, {}),
          cb
        );
        log("tool code running", {
          code,
          result,
        });
        return result;
      }
    }
  }
  return false;
}
