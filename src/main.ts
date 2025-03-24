import { setGlobalDispatcher, ProxyAgent } from "undici";
import "dotenv/config";
import {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  WebContents,
  screen,
} from "electron";
import path from "path";
import * as handlers from "./handlers";
import { startPollTG } from "./tgpoll";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (process.env.HTTPS_PROXY) {
  const proxyAgent = new ProxyAgent({ uri: process.env.HTTPS_PROXY });
  setGlobalDispatcher(proxyAgent);
}

let rightView: BrowserView | null = null; // Store rightView in a variable accessible within the module
let mainWindow: BrowserWindow | null = null; // Store mainWindow in a variable accessible within the module
const LEFT_VIEW_WIDTH_RATIO = 0.5; // Define the ratio of left view's width. Adjust as needed (e.g., 0.5 for 50%)
const MAX_LEFT_VIEW_WIDTH = 300; // Set a minimum width for the left view to prevent it from becoming too small.

const createWindow = () => {
  const height = Math.round(
    (screen.getPrimaryDisplay().workAreaSize.height * 3) / 4
  );
  const width = Math.round((height * 4) / 3 + 300);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width, // Increased width to accommodate two views
    height,
    minWidth: MAX_LEFT_VIEW_WIDTH * 2, // Ensure window cannot be smaller than two times minimum view
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // contextIsolation:false, //disable it for test
      nodeIntegration: false, // Enable node integration for IPC communication
      contextIsolation: true, // Disable context isolation for simplicity in this example
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Create the right-side BrowserView
  rightView = new BrowserView({
    webPreferences: {
      // preload: path.join(__dirname, "preload.js"),
      // contextIsolation:false,
      nodeIntegration: false, // Enable node integration for IPC communication
      contextIsolation: true, // Disable context isolation for simplicity in this example
    },
  });
  mainWindow.addBrowserView(rightView);

  // Set the user agent for rightView to a Chrome user agent
  rightView.webContents.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  rightView.webContents.loadURL("https://www.google.com");

  // Monitor the dom-ready event for rightView
  monitorRightViewDomReady(rightView.webContents);

  mainWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      // Set the bounds of the right-side view (half of the window width)
      const { width, height } = mainWindow.getContentBounds();
      setViewsBounds(width, height);
    }, 1000);
  });

  // Handle window resize to adjust view bounds
  mainWindow.on("resize", () => {
    if (!rightView || !mainWindow) return;
    const { width, height } = mainWindow.getContentBounds();
    setViewsBounds(width, height);
  });
  // Open the DevTools for main window in the bottom.
  // mainWindow.webContents.openDevTools({ mode: "detach" });
  // rightView.webContents.openDevTools({ mode: "detach" });
};

function setViewsBounds(windowWidth: number, windowHeight: number) {
  if (!mainWindow || !rightView) {
    return;
  }
  const leftViewWidth = Math.min(
    MAX_LEFT_VIEW_WIDTH,
    windowWidth * LEFT_VIEW_WIDTH_RATIO
  );

  mainWindow.setBrowserView(null);
  const bounds = { x: 0, y: 0, width: leftViewWidth, height: windowHeight };
  mainWindow.setBrowserView(rightView);

  mainWindow.getContentBounds();
  rightView.setBounds({
    x: leftViewWidth,
    y: 0,
    width: windowWidth - leftViewWidth,
    height: windowHeight,
  });
  //getBrowserView bounds is undefined.
  // console.log("leftView bounds", leftView.getBounds())

  mainWindow.webContents.send("set-left-view-bounds", bounds);
}

global.rightViewDomReadyResolve = null;

// Function to monitor dom-ready event
function monitorRightViewDomReady(webContents: WebContents) {
  webContents.on("dom-ready", () => {
    console.log("rightView DOM is ready!");
    if (rightViewDomReadyResolve) {
      rightViewDomReadyResolve();
      rightViewDomReadyResolve = null;
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

  Object.keys(handlers).forEach((key) => {
    ipcMain.handle(
      key.replace(/([A-Z])/g, "-$1").toLowerCase(),
      async (event, args) => {
        // eslint-disable-next-line import/namespace
        return await handlers[key](event, args, rightView);
      }
    );
  });

  if (process.env.TG_START_POLL) {
    startPollTG((update) => {
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text;
        if (text) {
          console.log(`收到消息: ${text} 来自用户 ID: ${chatId}`);
          mainWindow.webContents.send("tg-text", text);
        }
      }
    });
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
