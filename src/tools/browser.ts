import {
  loadUrl,
  captureScreen,
  pageDown,
  dumpFull,
  queryText,
} from "../ElectronWindow";
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
  let url = args.url as string;
  console.log(`need browser url:${url}`);
  if (!url.startsWith("http")) {
    url = `google.com/search?q=${url}`;
  }
  await loadUrl(url);
  //等待5秒钟以确保内容加载完毕
  await new Promise((r) => setTimeout(r, 5000));
  return dumpFull();
};

export const twitter_doc: DOC = [
  "通过某个推特的地址获取最新的推特内容",
  [["url", "string", "要访问的推特网址"]],
];
export const twitter: TOOL_FUNCTION = async (args) => {
  const url = args.url as string;
  console.log(`need browser url:${url}`);
  if (!url.startsWith("http")) {
    throw new Error("不正确的网址");
  }
  await loadUrl(url);
  await new Promise((r) => setTimeout(r, 5000));
  const str = await dumpFull();
  const matchs = [
    ...str
      .matchAll(
        /<a href="(https:\/\/x.com\/[^/]+\/status\/[\d]+)">([^<]*)<\/a>([\s\S]*?)<a href="https:\/\/x.com\/[^/]+\/status\/[\d]+\/analytics">/gm
      )
      .map((a) => a.slice(1)),
  ];
  if (matchs && matchs.length) {
    return matchs
      .map((x) => `在 ${x[1]} 发表了 ${x[2]}，网址为 ${x[0]}`)
      .join("\n");
  }
  return "没有找到任何内容";
};

export const financialjuiceLatest_doc: DOC = [
  "返回 financialjuice.com 最新的新闻条目",
  [["limit", "int", "限制返回内容的个数"]],
];
export const financialjuiceLatest: TOOL_FUNCTION = async (args) => {
  const limit = args.limit + 1;
  await loadUrl("https://www.financialjuice.com/home");
  //等待5秒钟以确保内容加载完毕
  await new Promise((r) => setTimeout(r, 5000));
  const news = await queryText(".media-body .headline-title");
  const times = await queryText(".media-body .time");
  console.log("browser loaded", news.length, times.length, limit);
  if (times.length >= news.length && news.length >= limit) {
    return news
      .slice(0, limit)
      .map((item, idx) => `${times[idx]} ${item}`)
      .join("\n");
  }
  return "没有找到任何内容";
};
