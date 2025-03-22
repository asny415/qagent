export async function wechatSend(event, params) {
  const { msgtype, content } = params;
  let body = {};
  if (msgtype == "markdown") {
    body = {
      msgtype: "markdown",
      markdown: {
        content,
      },
    };
  }
  const rsp = await fetch(
    "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=63282fd9-93c5-423c-82fa-7a1285eaf2e1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const json = await rsp.json();
  console.log(json);
}
