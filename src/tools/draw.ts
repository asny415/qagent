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
