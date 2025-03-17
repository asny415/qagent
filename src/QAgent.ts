import { nextTick } from "vue";
import { loadUrl, captureScreen, pageDown } from "./ElectronWindow";
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
    try {
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
          this.process_rsp(currentMessage, cb);
          break;
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
        content: `At each turn, if you decide to invoke any of the function(s), it should be wrapped with \`\`\`tool_code\`\`\`. The python methods described below are imported and available, you can only use defined methods. The generated code should be readable and efficient. The response to a method will be wrapped in \`\`\`tool_output\`\`\` use it to call more tools or generate a helpful, friendly response. When using a \`\`\`tool_call\`\`\` think step by step why and how it should be used.

The following Python methods are available:

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

${task}
`,
      },
    ];
    await this.taskRun(cb);
  }

  async descriptImage(image: string, cb: ProgressCB) {
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
              content: `请详细描述这幅图片的内容，尤其不要遗漏任何文字内容`,
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
          return currentMessage;
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
    const browse_reg = /browse\((.*?)\)/s;
    if (text.match(toolcode_reg)) {
      const code = text.match(toolcode_reg)[1];
      console.log("need run code", code);
      if (code.indexOf("next_page()") >= 0) {
        await this.nextPage(cb);
      } else if (code.match(browse_reg)) {
        let url = code.match(browse_reg)[1];
        if (url.startsWith("url=")) {
          url = url.slice(4);
        }
        await this.browse(JSON.parse(url), cb);
      }
    }
  }
}
