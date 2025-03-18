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

export const pageDown = async () => {
  if (window.myAPI && window.myAPI.send) {
    await window.myAPI.send("next-page");
    console.log("next page called");
  } else {
    console.error("electronAPI.send is not available!");
  }
};
