import { send2Telegram } from "../ElectronWindow";
import { DOC, TOOL_FUNCTION, renderMarkdown } from "./common";

export const sendText_doc: DOC = [
  "给我的telegram发送文本类型的消息",
  [["text", "string", "要发送的消息内容，支持Markdown语法"]],
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

export const sendPhoto_doc: DOC = [
  "给我的telegram发送图片",
  [
    [
      "photo",
      "string",
      "要发送的图片，可以是本地文件路径，网络地址或者是data uri",
    ],
    ["caption", "string", "图片描述，支持Markdown语法"],
  ],
];

export const sendPhoto: TOOL_FUNCTION = async (args) => {
  const { caption, photo } = args;
  console.log(`send media: "${photo}" "${caption}" to telegram`);

  await send2Telegram({
    path: "/sendPhoto",
    body: {
      caption: renderMarkdown(caption),
      parse_mode: "HTML",
      photo,
    },
  });
};

export const sendVideo_doc: DOC = [
  "给我的telegram发送视频",
  [
    [
      "video",
      "string",
      "要发送的视频，可以是本地文件路径，网络地址或者是data uri",
    ],
    ["caption", "string", "视频描述，支持Markdown语法"],
  ],
];

export const sendVideo: TOOL_FUNCTION = async (args) => {
  const { caption, video } = args;
  console.log(`send media: "${video}" "${caption}" to telegram`);

  await send2Telegram({
    path: "/sendVideo",
    body: {
      caption: renderMarkdown(caption),
      parse_mode: "HTML",
      video,
      supports_streaming: true,
    },
  });
};
