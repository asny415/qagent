import { send2Wechat } from "../ElectronWindow";
export const wechatSendMarkdown_doc: DOC = [
  "给我的微信账号发送文本格式的消息，支持markdown语法",
  [["md", "string", "要发送的文本消息内容"]],
];

export const wechatSendMarkdown: TOOL_FUNCTION = async (args) => {
  const { md } = args;
  await send2Wechat({
    msgtype: "markdown",
    content: md.replaceAll("\\n", "\n"),
  });
};
