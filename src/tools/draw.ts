import { getEnv, iNiverseMixInNode } from "../ElectronWindow";
export const drawCard_doc: DOC = [
  "抽卡操作，使用随机的提示词和随机的大小生成随机的图片，除非用户明确的用中文提到'抽卡'，否额你不应当调用这个函数",
];
export const drawCard: TOOL_FUNCTION = async () => {
  const sizes = [512, 768, 1024, 1080];
  const width = sizes.sort(() => Math.random() - 0.5)[0];
  const height = sizes.sort(() => Math.random() - 0.5)[0];
  const prompt = await getEnv("DRAW_CARD_PROMPT");
  return await iNiverseMixInNode({ prompt, width, height });
};
