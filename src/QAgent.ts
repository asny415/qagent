import { nextTick } from "vue";
import {
  loadUrl,
  captureScreen,
  pageDown,
  dumpVisible,
} from "./ElectronWindow";
const API_BASE_URL = "http://192.168.3.227:11434/api";

type ProgressCB = (
  type: string,
  msg: string,
  role: string,
  done: string
) => void;

export class AIAgent {
  constructor() {
    this.msgBuffer = [];
  }

  async taskRun(cb: ProgressCB) {
    cb("thinking");
    try {
      if (this.msgBuffer.length >= 10) {
        throw new Error("too many messages");
      }
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma3:27b",
          messages: this.msgBuffer,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentMessage = "";
      let finish = false;

      while (!finish) {
        const { done, value } = await reader.read();
        if (done) {
          finish = true;
          cb("response", currentMessage, "assistant", true);
          this.msgBuffer.push({
            role: "assistant",
            content: currentMessage,
          });
          await this.process_rsp(currentMessage, cb);
          return;
        }
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.message) {
            currentMessage += data.message.content;
            cb("response", currentMessage, "assistant", false);
          }
        }
        await nextTick();
      }
      console.log("run finish");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async task(task: string, cb: ProgressCB) {
    console.log("running task:", task);
    this.msgBuffer = [
      {
        role: "user",
        content: `你是一个聪明的agent，会用用户的语言帮助查找想要的信息。你会利用并且只能利用下面的这些 python methods 扩展自己的能力, 如果你决定调用任何一个function(s), 你需要使用 \`\`\`tool_code\`\`\` 包裹它们，请尽可能使用简洁有效的函数调用并且调用函数的次数在一轮提问中最多不超过5次. 函数的响应将会被包裹在 \`\`\`tool_output\`\`\` 中并且你应该假设用户看不到其中的内容，你可以利用函数响应的内容进行更多次函数调用或者直接生成对用户有帮助且友善的响应. 在通过 \`\`\`tool_call\`\`\` 进行函数调用时，请逐步解释为什么你需要这样做.

你可以使用下面的这些函数:

\`\`\`python
def browse(url: str) -> str:
"""browse url in internal web browser, will capture screen shot on next turn

Args:
  url: the website address you want browse
"""

def next_page() -> void:
"""turn the web browser to next page to get more content
"""

\`\`\`

现在的时间是${new Date().toISOString},请你用用户的语言回答下面的用户提问:${task}
`,
      },
    ];
    await this.taskRun(cb);
    this.msgBuffer = [];
    cb("done");
  }

  async descriptImage(image: string, cb: ProgressCB) {
    cb("thinking");
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemma3:27b",
          messages: [
            {
              role: "user",
              content: `请详细描述这幅图片里的内容`,
              images: [image],
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentMessage = "";
      let finish = false;

      while (!finish) {
        const { done, value } = await reader.read();
        if (done) {
          finish = true;
          cb("vision", currentMessage, "assistant", true);
          const dump = await dumpVisible();
          console.log("dump screen got", dump);

          return `${currentMessage}
页面上详细的文字和链接内容如下：
${dump}`;
        }
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.message) {
            currentMessage += data.message.content;
            cb("vision", currentMessage);
          }
        }
        await nextTick();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async nextPage(cb: ProgressCB) {
    console.log("need to do next page");
    await pageDown();
    //等待5秒钟以确保内容加载完毕
    await new Promise((r) => setTimeout(r, 5000));
    console.log("browser loaded");
    const data = await captureScreen();
    console.log("browser screen is", data);
    const content = await this.descriptImage(data.split("base64,")[1], cb);
    console.log("image content is", content);
    if (content) {
      this.msgBuffer.push({
        role: "user",
        content: `\`\`\`tool_output
${content}
\`\`\``,
      });
      await this.taskRun(cb);
    }
  }

  async browse(url: string, cb: ProgressCB) {
    console.log(`need browser url:${url}`);
    await loadUrl(url);
    //等待5秒钟以确保内容加载完毕
    await new Promise((r) => setTimeout(r, 5000));
    console.log("browser loaded");
    const data = await captureScreen();
    console.log("browser screen is", data);
    const content = await this.descriptImage(data.split("base64,")[1], cb);
    console.log("image content is", content);
    if (content) {
      this.msgBuffer.push({
        role: "user",
        content: `\`\`\`tool_output
${content}
\`\`\``,
      });
      await this.taskRun(cb);
    }
  }
  async process_rsp(text: string, cb: ProgressCB) {
    const toolcode_reg = /```tool_code\n(.*?)\n```/s;
    const browse_reg = /browse\((?:url=)['"](.*)['"]\)/s;
    if (text.match(toolcode_reg)) {
      cb("thinking");
      const code = text.match(toolcode_reg)[1];
      console.log("need run code", code);
      if (code.indexOf("next_page()") >= 0) {
        await this.nextPage(cb);
      } else if (code.match(browse_reg)) {
        const url = code.match(browse_reg)[1];
        await this.browse(url, cb);
      }
    }
  }
}
