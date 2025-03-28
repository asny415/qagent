function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export async function comfyui(event, args, rv, cb) {
  console.log("in comfyui function cb is", cb);
  const clientId = generateUUID();
  const { prompt, path } = args;
  const COMFYUI_URI = process.env["COMFYUI_URI"];
  let promptid;
  {
    const rsp = await fetch(`${COMFYUI_URI}/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        prompt,
      }),
    });
    const json = await rsp.json();
    console.log("genurate rsp", json);
    promptid = json.prompt_id;
    if (!promptid) throw new Error("genurate fail!");
  }

  await new Promise((r) => {
    const ws = new WebSocket(
      `${COMFYUI_URI.replace("http", "ws")}/ws?clientId=${clientId}`
    );
    ws.addEventListener("message", (event) => {
      console.log("ws data", event.data);
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "status":
            console.log(
              `队列剩余任务: ${msg.data.status.exec_info.queue_remaining}`
            );
            break;
          case "executing":
            if (msg.data.node === null) {
              console.log("任务完成！");
              ws.close();
              r();
            } else {
              console.log(`正在执行节点: ${msg.data.node}`);
              cb("handler", `正在执行节点: ${msg.data.node}`);
            }
            break;
          case "progress":
            console.log(
              `进度: ${msg.data.value}/${msg.data.max} at node ${msg.data.node}`
            );
            cb(
              "handler",
              `进度: ${msg.data.value}/${msg.data.max} at node ${msg.data.node}`
            );
            break;
        }
      } catch (err) {
        console.error("error on parse message", err);
      }
    });
  });

  {
    const progressUrl = `${COMFYUI_URI}/history/${promptid}`;
    const rsp = await fetch(progressUrl);
    const json = await rsp.json();
    const result = getValueByPath(json[promptid].outputs, path);
    console.log("result", JSON.stringify(json), path, result);
    if (result) {
      const { filename, subfolder, type } = result;
      const imgurl = `${COMFYUI_URI}/view?filename=${filename}&subfolder=${
        subfolder || ""
      }&type=${type}`;
      return imgurl;
    }
  }
}
