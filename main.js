const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Ensure single AppData directory: 'Orbit Hide'
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'Orbit Hide'));
} catch (_) {}

// ─────────────────────────────────────────────────────────────────────────────
// PURE STEALTH MODE FOR RIGHT-CLICK CONTEXT MENU
// ─────────────────────────────────────────────────────────────────────────────
const args = process.argv;
const hideIdx = args.indexOf('--hide');
const isSilentHide = (hideIdx !== -1 && args[hideIdx + 1]);

if (isSilentHide) {
  // Execute completely in the background — ZERO windows, ZERO notifications!
  const targetPath = args[hideIdx + 1];
  try {
    const APP_DIR = path.join(process.env.APPDATA || path.join(process.env.HOME, 'AppData', 'Roaming'), 'Orbit Hide');
    const DB_FILE = path.join(APP_DIR, 'vault_db.json');
    if (!fs.existsSync(APP_DIR)) fs.mkdirSync(APP_DIR, { recursive: true });

    const clean = path.normalize(targetPath.trim());
    let db = { auth: { isSetup: false }, items: [], logs: [] };
    if (fs.existsSync(DB_FILE)) {
      try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (_) {}
    }
    if (!Array.isArray(db.items)) db.items = [];
    if (!Array.isArray(db.logs))  db.logs  = [];

    let item = db.items.find(i => i.itemPath.toLowerCase() === clean.toLowerCase());
    if (!item) {
      let isDir = false;
      try { isDir = fs.existsSync(clean) && fs.statSync(clean).isDirectory(); } catch (_) {}
      item = {
        id:          'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name:        path.basename(clean) || clean,
        itemPath:    clean,
        isDirectory: isDir,
        isHidden:    false,
        dateAdded:   new Date().toISOString()
      };
      db.items.unshift(item);
    }

    try {
      execSync(`attrib +h +s "${clean.replace(/\\+$/, '')}"`, { windowsHide: true });
      item.isHidden = true;
    } catch (_) {}

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action: 'STEALTH_CONTEXT_HIDE',
      targetPath: clean,
      success: true,
      details: 'Hidden via pure stealth context menu'
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Stealth hide error:', e);
  }

  // Exit immediately in background without opening any window
  app.quit();
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMAL GUI APPLICATION MODE
// ─────────────────────────────────────────────────────────────────────────────
try {
  require('./server.js');
} catch (e) {
  console.log('Internal server load notice:', e);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 850,
    minHeight: 550,
    title: 'Orbit Hide',
    icon: path.join(__dirname, 'build', 'icon.png'),
    backgroundColor: '#191919',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  loadAppWithRetry(15);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadAppWithRetry(retries = 15) {
  if (!mainWindow) return;
  mainWindow.loadURL('http://localhost:3000').catch((err) => {
    if (retries > 0) {
      setTimeout(() => loadAppWithRetry(retries - 1), 250);
    } else {
      console.error('Express server initialization timeout:', err);
    }
  });
}

ipcMain.handle('select-file-item', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Any File for Orbit Hide',
    properties: ['openFile'],
    buttonLabel: 'Select File'
  });
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder-item', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Any Folder for Orbit Hide',
    properties: ['openDirectory'],
    buttonLabel: 'Select Folder'
  });
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
