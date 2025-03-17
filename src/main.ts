import { app, BrowserWindow, BrowserView, ipcMain } from "electron";
import path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let rightView: BrowserView | null = null; // Store rightView in a variable accessible within the module
let mainWindow: BrowserWindow | null = null; // Store mainWindow in a variable accessible within the module

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200, // Increased width to accommodate two views
    height: 600,
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

  // Set the bounds of the right-side view (half of the window width)
  const { width, height } = mainWindow.getBounds();
  rightView.setBounds({ x: width / 2, y: 0, width: width / 2, height });
  // Load a default URL in the right-side view
  rightView.webContents.loadURL("https://www.google.com");

  // Handle window resize to adjust view bounds
  mainWindow.on("resize", () => {
    if (!rightView) return;
    const { width, height } = mainWindow.getBounds();
    rightView.setBounds({ x: width / 2, y: 0, width: width / 2, height });
  });
  // Open the DevTools for main window in the bottom.
  mainWindow.webContents.openDevTools({ mode: "bottom" });

  // rightView.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
  // Listen for the 'change-url' event from the renderer process
  ipcMain.on("change-url", (event, url) => {
    if (rightView) {
      rightView.webContents.loadURL(url);
    }
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
