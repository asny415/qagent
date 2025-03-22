// Interface for the exposed methods from preload.ts
interface WindowWithElectron extends Window {
  myAPI: {
    send: (channel: string, data: unknown) => void;
  };
}

// Ensure that window has electronAPI.send
declare const window: WindowWithElectron;

export const loadUrl = async (url) => {
  if (window.myAPI && window.myAPI.send) {
    await window.myAPI.send("change-url", url);
    console.log("change url called", url);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const getEnv = async (key) => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("get-env", key);
    console.log("change url called", key);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const iNiverseMixInNode = async (args) => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("i-niverse-mix", args);
    console.log("iNiverseMixInNode called");
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const fetchImageToDataUri = async (url) => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("fetch-image-to-data-uri", url);
    console.log("fetchImageToDataUri called");
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const captureScreen = async (): string => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("capture-right-view", null);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const dumpVisible = async (): string => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("dump-visible", null);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const dumpFull = async (): string => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("dump-full", null);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const send2Telegram = async (params): string => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("telegram-send", params);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const send2Wechat = async (params): string => {
  if (window.myAPI && window.myAPI.send) {
    return await window.myAPI.send("wechat-send", params);
  } else {
    console.error("electronAPI.send is not available!");
  }
};

export const pageDown = async () => {
  if (window.myAPI && window.myAPI.send) {
    await window.myAPI.send("next-page");
    console.log("next page called");
  } else {
    console.error("electronAPI.send is not available!");
  }
};
