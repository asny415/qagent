import { iNiverseMixInNode, loadUrl, getEnv } from "../ElectronWindow";
import { DOC, TOOL_FUNCTION } from "./common";

export const iNiverseMix_doc: DOC = [
  "使用iNiverseMix模型进行文生图，这个模型擅长亚洲国风少女的绘制",
  [
    ["prompt", "string", "prompt to generate image, only support english"],
    ["width", "int", "width of image"],
    ["height", "int", "height of image"],
  ],
];

export const iNiverseMix: TOOL_FUNCTION = async (args) => {
  const { prompt, width, height } = args;
  const url = await iNiverseMixInNode({
    prompt,
    width: width || 512,
    height: height || 512,
  });
  console.log("need generate image", prompt, width, height, url);
  await loadUrl(url);
  return url;
};

export const drawCard_doc: DOC = [
  "抽卡操作使用随机的提示词和随机的大小生成随机的图片",
];
export const drawCard: TOOL_FUNCTION = async () => {
  const sizes = [512, 768, 1024, 1080];
  const width = sizes.sort(() => Math.random() - 0.5)[0];
  const height = sizes.sort(() => Math.random() - 0.5)[0];
  const prompt = await getEnv("DRAW_CARD_PROMPT");
  return await iNiverseMix({ prompt, width, height });
};
