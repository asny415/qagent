import { loadUrl, captureScreen, pageDown, dumpFull } from "../ElectronWindow";
import { descriptImage, DOC, TOOL_FUNCTION } from "./common";

export const webOCR_doc: DOC = [
  "对某个网址截图并且进行OCR以识别其内容",
  [["url", "string", "要截图的网址"]],
];

export const webOCR: TOOL_FUNCTION = async (args, cb) => {
  const url = args.url as string;
  console.log(`need browser url:${url}`);
  await loadUrl(url);
  //等待5秒钟以确保内容加载完毕
  await new Promise((r) => setTimeout(r, 5000));
  console.log("browser loaded");
  const data = await captureScreen();
  console.log("browser screen is", data);
  const content = await descriptImage(data.split("base64,")[1], cb);
  console.log("image content is", content);
  return content;
};

export const nextPageOCR_doc: DOC = [
  "浏览器翻页并且对翻页以后的屏幕进行OCR以识别其内容",
];
export const nextPageOCR: TOOL_FUNCTION = async (args, cb) => {
  console.log("need to do next page");
  await pageDown();
  //等待5秒钟以确保内容加载完毕
  await new Promise((r) => setTimeout(r, 5000));
  console.log("browser loaded");
  const data = await captureScreen();
  console.log("browser screen is", data);
  const content = await descriptImage(data.split("base64,")[1], cb);
  console.log("image content is", content);
  return content;
};

export const browseWeb_doc: DOC = [
  "一次性获取某个网址的全部文字内容和链接",
  [["url", "string", "要浏览的网址"]],
];
export const browseWeb: TOOL_FUNCTION = async (args) => {
  const url = args.url as string;
  console.log(`need browser url:${url}`);
  await loadUrl(url);
  //等待5秒钟以确保内容加载完毕
  await new Promise((r) => setTimeout(r, 5000));
  return dumpFull();
};
