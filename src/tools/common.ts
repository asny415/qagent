import MarkdownIt from "markdown-it";
import { nextTick } from "vue";
import { dumpVisible } from "../ElectronWindow";
export const API_BASE_URL = "http://192.168.3.227:11434/api";

export type DOC = [string, [string, string, string][]];

export type ProgressCB = (
  type: string,
  msg: string,
  role: string,
  done: boolean,
  meta: Record<string, string | number | boolean> | null
) => void;
export type TOOL_FUNCTION = (
  args: Record<string, string | number | boolean>,
  cb: ProgressCB | null
) => string | null;

export function toPyType(type: string) {
  return (
    { string: "str", number: "int", int: "int", boolean: "bool" }[type] || "str"
  );
}

const md = new MarkdownIt();
const sanitizeHtml = (html) => {
  const allowedTags = [
    "b",
    "i",
    "u",
    "s",
    "del",
    "span",
    "a",
    "code",
    "pre",
    "blockquote",
  ];
  return html.replace(
    /<(\/)?(\w+)(\s*[^>]*)?>/g,
    (match, closingSlash, tagName, attrs) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return `<${closingSlash || ""}${tagName}${attrs || ""}>`;
      }
      return "";
    }
  );
};
export const renderMarkdown = (text) => {
  const html = md.render(text);
  return sanitizeHtml(html);
};

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function descriptImage(image: string, cb: ProgressCB) {
  cb("thinking");
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:12b",
        messages: [
          {
            role: "user",
            content: `这幅图片里有些什么`,
            images: [image],
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentMessage = "";
    let finish = false;

    while (!finish) {
      const { done, value } = await reader.read();
      if (done) {
        finish = true;
        cb("vision", currentMessage, "assistant", true);
        const dump = await dumpVisible();
        console.log("dump screen got", dump);

        return `${currentMessage}
页面上详细的文字和链接内容如下：
${dump}`;
      }
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.message) {
          currentMessage += data.message.content;
          cb("vision", currentMessage);
        }
      }
      await nextTick();
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
