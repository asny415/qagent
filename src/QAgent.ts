import { nextTick } from "vue";
import { loadUrl } from "./ElectronWindow";
const API_BASE_URL = "http://192.168.3.227:11434/api";
export class AIAgent {
  async task(task: string, cb: (msg: string) => void) {
    try {
      console.log("running task:", task);
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
          this.process_rsp(currentMessage);
          break;
        }
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.message) {
            currentMessage += data.message.content;
            cb(currentMessage);
          }
        }
        await nextTick();
      }
      console.log("run finish");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
  async browse(url: string) {
    console.log(`need browser url:${url}`);
    await loadUrl(url);
  }
  async process_rsp(text: string) {
    const browse_reg = /```tool_code\nbrowse\((.*?)\)\n```/s;
    if (text.match(browse_reg)) {
      let url = text.match(browse_reg)[1];
      if (url.startsWith("url=")) {
        url = url.slice(4);
      }
      await this.browse(JSON.parse(url));
    }
  }
}
