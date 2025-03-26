import { generateUUID } from "./tools/common";
// Interface for the exposed methods from preload.ts
interface WindowWithElectron extends Window {
  myAPI: {
    send: (channel: string, data: unknown) => void;
  };
}

// Ensure that window has electronAPI.send
declare const window: WindowWithElectron;

function invoke(channel: string) {
  return async function (...args: unknown) {
    const cb = args.pop();
    if (typeof cb !== "function") {
      args.push(cb);
    }
    const uuid = generateUUID();
    console.log("add listenter", uuid);
    window.myAPI.on(uuid, (event, params) => {
      console.log("receive progress", params);
      if (cb) {
        cb(...params);
      }
    });
    if (window.myAPI && window.myAPI.send) {
      let result;
      if (args.length == 1) {
        result = await window.myAPI.send(channel, { uuid, args: args[0] });
      } else {
        result = await window.myAPI.send(channel, { uuid, args });
      }
      console.log("remove listenter", uuid);
      window.myAPI.removeListener(uuid);
      return result;
    } else {
      console.error("electronAPI.send is not available!");
    }
  };
}

export const loadUrl = invoke("change-url");
export const getEnv = invoke("get-env");
export const comfyui = invoke("comfyui");
export const fetchImageToDataUri = invoke("fetch-image-to-data-uri");
export const captureScreen = invoke("capture-right-view");
export const dumpVisible = invoke("dump-visible");
export const dumpFull = invoke("dump-full");
export const send2Telegram = invoke("telegram-send");
export const send2Wechat = invoke("wechat-send");
export const log = invoke("log");
export const pageDown = invoke("next-page");
export const queryText = invoke("query-text");
