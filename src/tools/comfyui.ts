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
