let offset = 0;

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}`;
async function getUpdates() {
  try {
    const response = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}`);
    if (!response.ok) {
      console.error(`获取更新失败，状态码: ${response.status}`);
      return null; // 返回 null 表示获取更新失败
    }
    const data = await response.json();
    if (!data.ok) {
      console.error(`Telegram API 错误: ${data.description}`);
      return null; // 返回 null 表示 API 返回错误
    }
    return data.result; // 返回更新结果数组
  } catch (error) {
    console.error("获取更新时发生错误:", error);
    return null; // 返回 null 表示发生异常
  }
}

export async function startPollTG(
  handleUpdate: (update: unknown) => Promise<void>
) {
  console.log("Bot 正在启动...");
  const validTime = new Date().getTime() + 10000;
  const done = false;
  while (!done) {
    const updates = await getUpdates();
    if (updates && updates.length > 0) {
      for (const update of updates) {
        offset = update.update_id + 1; // 更新 offset，处理下一个更新
        if (new Date().getTime() < validTime) {
          continue;
        }
        await handleUpdate(update);
      }
    } else if (updates === null) {
      // getUpdates 返回 null 表示获取更新失败，这里可以做一些错误处理，例如等待更长时间再重试
      console.log("获取更新失败，等待更长时间后重试...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 等待 10 秒
      continue; // 继续下一次循环
    }

    // 设置轮询间隔，例如每 10 秒检查一次更新
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
