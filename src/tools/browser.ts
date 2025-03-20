import { loadUrl, captureScreen, pageDown } from "../ElectronWindow";
import { descriptImage, DOC, TOOL_FUNCTION } from "./common";

export const browse_doc: DOC = [
  "浏览某个网址并返回首屏的内容",
  [["url", "string", "要浏览的网址"]],
];

export const browse: TOOL_FUNCTION = async (args, cb) => {
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

export const nextPage_doc: DOC = ["返回浏览器下一页的内容"];
export const nextPage: TOOL_FUNCTION = async (args, cb) => {
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
