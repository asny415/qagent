import { send2Telegram } from "../ElectronWindow";
import { DOC, TOOL_FUNCTION, renderMarkdown } from "./common";

export const sendText_doc: DOC = [
  "给我的telegram发送文本消息，只需要提供文本消息内容即可，不需要关心其他参数",
  [["text", "string", "要发送的消息内容，支持多段文字"]],
];

export const sendText: TOOL_FUNCTION = async (args) => {
  const { text } = args;
  await send2Telegram({
    path: "/sendMessage",
    body: {
      text: renderMarkdown(text),
      parse_mode: "HTML",
    },
  });
};

export const sendMarkdown_doc: DOC = [
  "给我的telegram发送Markdown格式的消息，只需要提供文本消息内容即可，不需要关心其他参数",
  [["md", "string", "要发送的Markdown格式的消息内容"]],
];

export const sendMarkdown: TOOL_FUNCTION = async (args) => {
  const { md } = args;
  await send2Telegram({
    path: "/sendMessage",
    body: {
      text: renderMarkdown(md),
      parse_mode: "HTML",
    },
  });
};

export const sendMedia_doc: DOC = [
  "给telegram用户发送单张图片，需要提供图片和图片描述",
  [
    [
      "photo",
      "string",
      "要发送的图片，可以是本地文件路径，网络地址或者是data uri",
    ],
    ["caption", "string", "图片描述，支持Markdown语法"],
  ],
];

export const sendMedia: TOOL_FUNCTION = async (args) => {
  const { caption, photo } = args;
  console.log(`send media: "${photo}" "${caption}" to telegram`);

  await send2Telegram({
    path: "/sendPhoto",
    body: {
      type: "photo",
      caption: renderMarkdown(caption),
      parse_mode: "HTML",
      photo: photo,
    },
  });
};
