import fs from "fs";
import path from "path";
import { tmpdir } from "os";

export async function telegramSend(event, params) {
  const { body, path: apiPath } = params;
  console.log("telegram send", body, apiPath);
  const BOT_TOKEN = process.env["TG_BOT_TOKEN"];
  const CHAT_ID = process.env["TG_BOT_CHATID"];
  const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);

  // Iterate through the body and append each key-value pair to formData
  for (const key in body) {
    if (key === "photo" && body[key].startsWith("http://")) {
      // Download the image and add it as a file
      const response = await fetch(body[key]);
      if (!response.ok) {
        throw new Error(
          `Failed to download image "${body[key]}": ${response.statusText}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a temporary file
      const tempFilePath = path.join(tmpdir(), `temp-image-${Date.now()}.jpg`);
      fs.writeFileSync(tempFilePath, buffer);

      // Add the file to formData
      const file = new Blob([buffer]);
      formData.append(key, file, path.basename(tempFilePath));
    } else {
      formData.append(key, body[key]);
    }
  }

  for (let i = 0; i < 3; i++) {
    try {
      const rsp = await fetch(`${TELEGRAM_API}${apiPath}`, {
        method: "POST",
        body: formData,
      });

      const json = await rsp.json();
      console.log(json);
      return json;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log(`retry ${i}`);
    }
  }
}
