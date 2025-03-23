import { CronExpressionParser } from "cron-parser";
import { listPrefix, dbGet, dbPut } from "./tools/db";
import { AIAgent } from "./QAgent";
import { log } from "./ElectronWindow";

const agent = new AIAgent();

async function singleTurn() {
  const crontasks = await listPrefix({ prefix: "cron-" });
  console.log("开始检查定时任务", crontasks);
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
    const cron = params.slice(0, 6).join(" ");
    const text = params.slice(6)[0];
    try {
      const interval = CronExpressionParser.parse(cron, options);
      const ts = interval.next().toString();
      const taskkey = `task-result-${key}-${ts}`;
      let step = 0;
      console.log("new task", { taskkey, text });
      //如果还没有任务成功
      const result = await dbGet({ key: taskkey });
      if (!result) {
        //运行任务
        await agent.task(text, async (type, msg, role, done) => {
          if (done) {
            log(`progress-${taskkey}-${step++}`, { msg });
            console.log(msg);
          }
        });
        await dbPut({ key: taskkey, value: "success" });
        console.log("任务标记为已完成");
      } else {
        console.log("任务已执行过");
      }
    } catch (err) {
      console.log("Error:", err.message);
    }
  }
}

(async () => {
  const cron = await getEnv("QAGENT_START_CRON");
  if (cron) {
    console.log("start cron ...");
    //每十分钟执行一次
    setInterval(singleTurn, 10 * 60 * 1000);
    singleTurn();
  }
})();
