import { nextTick } from "vue";
import { ProgressCB, API_BASE_URL } from "./tools/common";
import { toolGo, toolsDoc } from "./tools";

export class AIAgent {
  constructor() {
    this.msgBuffer = [];
  }

  async taskRun(task: string, cb: ProgressCB) {
    cb("thinking");
    try {
      if (this.msgBuffer.length >= 10) {
        throw new Error("too many messages");
      }
      this.msgBuffer[this.msgBuffer.length - 1].content += `\n${task}`;

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
          await this.process_rsp(task, currentMessage, cb);
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
    const doc = toolsDoc();
    this.msgBuffer = [
      {
        role: "user",
        content: `你是一个聪明的agent，会用用户的语言帮助查找想要的信息。你会利用并且只能利用下面的这些 python methods 扩展自己的能力, 如果你决定调用任何一个function(s), 你需要使用 \`\`\`tool_code\`\`\` 包裹它们，请尽可能使用简洁有效的函数调用并且调用函数的次数在一轮提问中最多不超过10次. 函数的响应将会被包裹在 \`\`\`tool_output\`\`\` 中并且你应该假设用户看不到其中的内容，你可以利用函数响应的内容进行更多次函数调用或者直接生成对用户有帮助且友善的响应. 在通过 \`\`\`tool_call\`\`\` 进行函数调用时，请逐步解释为什么你需要这样做.

你可以使用下面的这些函数:

\`\`\`python
${doc}
\`\`\`

现在的时间是${new Date().toISOString},请你用用户的语言回答用户的提问:
`,
      },
    ];
    await this.taskRun(task, cb);
    this.msgBuffer = [];
    cb("done");
  }

  async process_rsp(task: string, text: string, cb: ProgressCB) {
    const result = await toolGo(text, cb);
    if (result) {
      this.msgBuffer.push({
        role: "user",
        content: `\`\`\`tool_output\n${result}\n\`\`\``,
      });
      await this.taskRun(task, cb);
    }
  }
}
