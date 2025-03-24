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
    if (window.myAPI && window.myAPI.send) {
      if (args.length == 1) {
        return await window.myAPI.send(channel, args[0]);
      }
      return await window.myAPI.send(channel, args);
    } else {
      console.error("electronAPI.send is not available!");
    }
  };
}

export const loadUrl = invoke("change-url");
export const getEnv = invoke("get-env");
export const iNiverseMixInNode = invoke("i-niverse-mix");
export const fetchImageToDataUri = invoke("fetch-image-to-data-uri");
export const captureScreen = invoke("capture-right-view");
export const dumpVisible = invoke("dump-visible");
export const dumpFull = invoke("dump-full");
export const send2Telegram = invoke("telegram-send");
export const send2Wechat = invoke("wechat-send");
export const log = invoke("log");
export const pageDown = invoke("next-page");
export const queryText = invoke("query-text");
