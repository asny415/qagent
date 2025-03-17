import { app, BrowserWindow, BrowserView, ipcMain } from "electron";
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
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, // Increased width to accommodate two views
    height: 600,
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

  setTimeout(() => {
    // Set the bounds of the right-side view (half of the window width)
    const { width, height } = mainWindow.getContentBounds();
    setViewsBounds(width, height);
  }, 1000);

  // Handle window resize to adjust view bounds
  mainWindow.on("resize", () => {
    if (!rightView || !mainWindow) return;
    const { width, height } = mainWindow.getContentBounds();
    setViewsBounds(width, height);
  });
  // Open the DevTools for main window in the bottom.
  mainWindow.webContents.openDevTools({ mode: "bottom" });

  // rightView.webContents.openDevTools();
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

  // Listen for the 'change-url' event from the renderer process
  ipcMain.handle("change-url", (event, url) => {
    if (rightView) {
      console.log(`right view should load url ${url}`);
      rightView.webContents.loadURL(url);
    } else {
      console.error("rightView is not available.");
    }
  });

  // Listen for the 'capture-right-view' event from the renderer process
  ipcMain.handle("capture-right-view", async () => {
    console.log("*** debug, need capture right view");
    return await captureRightView();
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
