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

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let rightView: BrowserView | null = null; // Store rightView in a variable accessible within the module
let mainWindow: BrowserWindow | null = null; // Store mainWindow in a variable accessible within the module
const LEFT_VIEW_WIDTH_RATIO = 0.5; // Define the ratio of left view's width. Adjust as needed (e.g., 0.5 for 50%)
const MIN_LEFT_VIEW_WIDTH = 300; // Set a minimum width for the left view to prevent it from becoming too small.

const createWindow = () => {
  const height = Math.round(
    (screen.getPrimaryDisplay().workAreaSize.height * 3) / 4
  );
  const width = Math.round((height * 18) / 16);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width, // Increased width to accommodate two views
    height,
    minWidth: MIN_LEFT_VIEW_WIDTH * 2, // Ensure window cannot be smaller than two times minimum view
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
      preload: path.join(__dirname, "preload.js"),
      // contextIsolation:false,
      nodeIntegration: true, // Enable node integration for IPC communication
      contextIsolation: false, // Disable context isolation for simplicity in this example
    },
  });
  mainWindow.addBrowserView(rightView);
  const iPhoneUserAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1";
  rightView.webContents.setUserAgent(iPhoneUserAgent);
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
  // mainWindow.webContents.openDevTools({ mode: "bottom" });
  // rightView.webContents.openDevTools({ mode: "bottom" });
};

function setViewsBounds(windowWidth: number, windowHeight: number) {
  if (!mainWindow || !rightView) {
    return;
  }
  const leftViewWidth = Math.max(
    MIN_LEFT_VIEW_WIDTH,
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
// Function to capture the right view and return base64
const captureRightView = async (): Promise<string | null> => {
  if (!rightView || !mainWindow) {
    console.error("rightView or mainWindow is not available.");
    return null;
  }
  try {
    const bounds = rightView.getBounds();
    const rect = {
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height,
    };
    console.log("need capture page", rect);

    const image = await rightView.webContents.capturePage(rect);

    return image.toDataURL();
  } catch (error) {
    console.error("Error capturing right view:", error);
    return null;
  }
};

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

let rightViewDomReadyResolve: () => void | null = null;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

  ipcMain.handle("telegram-send", async (event, params) => {
    const { body, path } = params;
    const BOT_TOKEN = process.env["TG_BOT_TOKEN"];
    const CHAT_ID = process.env["TG_BOT_CHATID"];
    const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    console.log("env", BOT_TOKEN, CHAT_ID);
    const rsp = await fetch(`${TELEGRAM_API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        ...body,
      }),
    });
    const json = await rsp.json();
    console.log(json);
    return json;
  });

  ipcMain.handle("next-page", async () => {
    if (rightView) {
      console.log("next-page called");
      const bounds = rightView.getBounds();
      setTimeout(() => {
        rightView.webContents.sendInputEvent({
          type: "mouseWheel",
          x: bounds.width / 2, // 触发滚动的 X 坐标（屏幕中的某处）
          y: bounds.height / 2, // 触发滚动的 Y 坐标
          deltaX: 0, // 不左右滚动
          deltaY: -bounds.height * 0.8, // 负值代表向上滚动，数值控制滚动距离
          canScroll: true,
        });
      }, 1000);
    } else {
      console.error("rightView is not available.");
    }
  });

  // Listen for the 'change-url' event from the renderer process
  ipcMain.handle("change-url", (event, url) => {
    if (rightView) {
      console.log(`right view should load url ${url}`);
      return new Promise((r) => {
        rightViewDomReadyResolve = r;
        rightView.webContents.loadURL(url);
      });
    } else {
      console.error("rightView is not available.");
    }
  });

  // Listen for the 'capture-right-view' event from the renderer process
  ipcMain.handle("capture-right-view", async () => {
    console.log("*** debug, need capture right view");
    return await captureRightView();
  });

  ipcMain.handle("dump-visible", async () => {
    const result = await rightView.webContents.executeJavaScript(`(()=>{
      
function dumpvisible(node,viewpoint={left:0,top:0,right:window.innerWidth, bottom:window.innerHeight}) {
    let result = "";
    if (['SCRIPT', 'STYLE', 'NOSCRIPT','#comment'].indexOf(node.nodeName)>=0) return result;
    if (!node.getBoundingClientRect) return result;
    if (node.textContent) {
        const rect = node.getBoundingClientRect();
        let inside = false
        if (node.checkVisibility && !node.checkVisibility()) {
            return result;
        }
        if (rect.left >= viewpoint.left && rect.right <= viewpoint.right && rect.top >= viewpoint.top && rect.bottom <= viewpoint.bottom) {
            inside = true;
        }
        for (const c of (node.childNodes || [])) {
            if (c.nodeName == "#text") {
                if (inside) {
                    result += c.textContent;
                }
            } else {
                if (c.nodeName == 'A' && inside) {
                    result += \`<a href="\${c.href}">\`
                }
                result += \` \${dumpvisible(c, viewpoint, result).trim()} \`;
                if (c.nodeName == 'A' && inside) {
                    result += \`</a>\`
                }
            }
        }        
    }
    return result;
}

      return dumpvisible(document.body)
})()`);
    console.log("page text", result);
    return result;
  });
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
