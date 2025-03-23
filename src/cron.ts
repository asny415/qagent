import { CronExpressionParser } from "cron-parser";
import { listPrefix, dbGet, dbPut } from "./tools/db";
import { AIAgent } from "./QAgent";
import { log } from "./ElectronWindow";

const agent = new AIAgent();

//每十分钟执行一次
setInterval(async () => {
  console.log("开始检查定时任务");
  const crontasks = await listPrefix("cron-");
  const options = {
    currentDate: new Date(
      Math.floor(new Date().getTime() / (24 * 3600 * 1000)) *
        (24 * 3600 * 1000) +
        8 * 3600 * 1000
    ).toISOString(),
    endDate: new Date(new Date().getTime() + 10 * 60 * 1000).toISOString(),
    tz: "Asia/Shanghai",
  };
  for (const kv of crontasks) {
    const [key, task] = kv;
    const params = task.split(/[\s]+/);
    const cron = params.slice(0, 5).join(" ");
    const text = params.slice(5);
    try {
      const interval = CronExpressionParser.parse(cron, options);
      const ts = interval.next().toString();
      const taskkey = `task-result-${key}-${ts}`;
      let step = 0;
      console.log("new task", taskkey);
      //如果还没有任务成功
      const result = await dbGet(taskkey);
      if (!result) {
        //运行任务
        await agent.task(text, async (type, msg, role, done) => {
          if (done) {
            log(`progress-${taskkey}-${step++}`, msg);
          }
        });
        await dbPut(taskkey, "success");
      }
    } catch (err) {
      console.log("Error:", err.message);
    }
  }
}, 10 * 60 * 1000);
