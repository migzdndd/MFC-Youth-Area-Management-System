const { app, BrowserWindow, shell, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let appTray = null;

function createApplicationMenu() {
  const template = [
    {
      label: 'MFC Youth AMS',
      submenu: [
        {
          label: 'About MFC Youth AMS',
          click: () => {
            shell.openExternal('https://github.com/migzdndd/MFC-Youth-Area-Management-System');
          }
        },
        { type: 'separator' },
        {
          label: 'Official Website',
          click: () => {
            shell.openExternal('https://mfcyouth.org');
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Application' }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Reload View',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          }
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Kiosk Mode',
          accelerator: 'F10',
          click: () => {
            if (mainWindow) mainWindow.setKiosk(!mainWindow.isKiosk());
          }
        }
      ]
    },
    {
      label: 'Help & Transparency',
      submenu: [
        {
          label: 'System Changelogs',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('mfc:navigate', { detail: 'changelogs' }));");
            }
          }
        },
        {
          label: 'Developer Portfolio',
          click: () => {
            shell.openExternal('https://migzdndd.github.io/web-portfolio/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  const iconPath = path.join(__dirname, '../MFCYouth.ico');
  try {
    appTray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open MFC Youth AMS',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Continuous Kiosk Mode',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.setKiosk(true);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    appTray.setToolTip('MFC Youth Area Management System');
    appTray.setContextMenu(contextMenu);

    appTray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('[Electron] Tray initialization notice:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 650,
    title: 'MFC Youth AMS System',
    icon: path.join(__dirname, '../MFCYouth.ico'),
    backgroundColor: '#002847',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  createApplicationMenu();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
