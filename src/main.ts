import { app, BrowserWindow, BrowserView, session } from "electron";
import path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width to accommodate two views
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // contextIsolation:false, //disable it for test
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
  const rightView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // contextIsolation:false,
    },
  });
  mainWindow.addBrowserView(rightView);

  // Set the bounds of the right-side view (half of the window width)
  const { width, height } = mainWindow.getBounds();
  rightView.setBounds({ x: width / 2, y: 0, width: width / 2, height });
  // Load a URL in the right-side view
  rightView.webContents.loadURL("https://www.google.com");

  // Handle window resize to adjust view bounds
  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    rightView.setBounds({ x: width / 2, y: 0, width: width / 2, height });
  });

  // Open the DevTools for main window.
  // mainWindow.webContents.openDevTools();

  // rightView.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

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
