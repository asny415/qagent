// /Users/wwq/code/self/qagent/src/preload.ts
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("myAPI", {
  send: (channel: string, data: unknown) => {
    // whitelist channels
    const validChannels = ["change-url", "capture-right-view"];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    } else {
      console.log("invalid channel", channel);
    }
  },
  on: (channel: string, cb: () => void) => {
    ipcRenderer.on(channel, (event, ...args) => cb(event, ...args));
  },
});
