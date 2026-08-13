const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');
const { exec }   = require('child_process');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// AppData Directories
// ─────────────────────────────────────────────────────────────────────────────
function getAppDataDir() {
  const base = process.env.APPDATA ||
    (process.platform === 'darwin'
      ? path.join(process.env.HOME, 'Library', 'Preferences')
      : path.join(process.env.HOME, '.local', 'share'));
  const dir = path.join(base, 'Orbit Hide');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const APP_DIR = getAppDataDir();
const DB_FILE = path.join(APP_DIR, 'vault_db.json');

// ─────────────────────────────────────────────────────────────────────────────
// Database Helpers
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_DB = {
  auth: {
    masterHash: null,
    salt:       null,
    isSetup:    false,
    q1:         null,
    a1Hash:     null,
    q2:         null,
    a2Hash:     null
  },
  items: [],
  logs:  []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) { writeDB(DEFAULT_DB); return deepCopy(DEFAULT_DB); }
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

    let migrated = false;
    if (db.auth && db.auth.passwordHash && !db.auth.masterHash) {
      db.auth.masterHash = db.auth.passwordHash;
      delete db.auth.passwordHash;
      migrated = true;
    }
    if (db.auth && db.auth.masterHash && !db.auth.isSetup) {
      db.auth.isSetup = true;
      migrated = true;
    }
    if (!Array.isArray(db.items)) { db.items = []; migrated = true; }
    if (!Array.isArray(db.logs))  { db.logs  = []; migrated = true; }

    if (migrated) writeDB(db);
    return db;
  } catch (e) {
    console.error('[DB] read error:', e.message);
    return deepCopy(DEFAULT_DB);
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] write error:', e.message);
  }
}

function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

function addLog(db, action, targetPath, success, details) {
  db.logs.unshift({
    id:        'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action, targetPath, success,
    details: details || ''
  });
  if (db.logs.length > 200) db.logs.length = 200;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell Helpers
// ─────────────────────────────────────────────────────────────────────────────
function runCmd(cmd) {
  return new Promise(resolve => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, output: (stderr || err.message).trim() });
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });
  });
}

function q(p) { return `"${String(p).replace(/\\+$/, '')}"`; }

// ─────────────────────────────────────────────────────────────────────────────
// HIDE / UNHIDE (attrib +h +s / -h -s)
// ─────────────────────────────────────────────────────────────────────────────
async function applyHide(targetPath) {
  if (!fs.existsSync(targetPath)) return false;
  const r = await runCmd(`attrib +h +s ${q(targetPath)}`);
  return r.success;
}

async function applyUnhide(targetPath) {
  if (!fs.existsSync(targetPath)) return false;
  const r = await runCmd(`attrib -h -s ${q(targetPath)}`);
  return r.success;
}

// ─────────────────────────────────────────────────────────────────────────────
// Windows Pickers & Password Hashing
// ─────────────────────────────────────────────────────────────────────────────
function pickFile() {
  return new Promise(resolve => {
    const ps =
      `Add-Type -AssemblyName System.Windows.Forms;` +
      `$d=New-Object System.Windows.Forms.OpenFileDialog;` +
      `$d.Title='Select Any File for Orbit Hide';` +
      `$d.Filter='All Files (*.*)|*.*';` +
      `if($d.ShowDialog() -eq 'OK'){Write-Output $d.FileName}`;
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`,
      { timeout: 60000 },
      (err, out) => resolve(out ? out.trim() : null)
    );
  });
}

function pickFolder() {
  return new Promise(resolve => {
    const ps =
      `Add-Type -AssemblyName System.Windows.Forms;` +
      `$d=New-Object System.Windows.Forms.FolderBrowserDialog;` +
      `$d.Description='Select Any Folder for Orbit Hide';` +
      `if($d.ShowDialog() -eq 'OK'){Write-Output $d.SelectedPath}`;
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`,
      { timeout: 60000 },
      (err, out) => resolve(out ? out.trim() : null)
    );
  });
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-REGISTER WINDOWS CONTEXT MENU FOR NEW USERS ON BOOT
// ─────────────────────────────────────────────────────────────────────────────
function autoRegisterContextMenu() {
  if (process.platform !== 'win32') return;
  try {
    const exePath = process.execPath.toLowerCase().includes('orbit hide.exe')
      ? process.execPath
      : path.join(__dirname, 'dist', 'win-unpacked', 'Orbit Hide.exe');

    const fileShellKey   = 'HKCU\\Software\\Classes\\*\\shell\\OrbitHide';
    const dirShellKey    = 'HKCU\\Software\\Classes\\Directory\\shell\\OrbitHide';
    const folderShellKey = 'HKCU\\Software\\Classes\\Folder\\shell\\OrbitHide';

    const cmd =
      `reg add "${fileShellKey}" /ve /t REG_SZ /d "Hide with Orbit Hide" /f & ` +
      `reg add "${fileShellKey}" /v "Icon" /t REG_SZ /d "\\"${exePath}\\"" /f & ` +
      `reg add "${fileShellKey}\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"--hide\\" \\"%1\\"" /f & ` +
      `reg add "${dirShellKey}" /ve /t REG_SZ /d "Hide with Orbit Hide" /f & ` +
      `reg add "${dirShellKey}" /v "Icon" /t REG_SZ /d "\\"${exePath}\\"" /f & ` +
      `reg add "${dirShellKey}\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"--hide\\" \\"%1\\"" /f & ` +
      `reg add "${folderShellKey}" /ve /t REG_SZ /d "Hide with Orbit Hide" /f & ` +
      `reg add "${folderShellKey}" /v "Icon" /t REG_SZ /d "\\"${exePath}\\"" /f & ` +
      `reg add "${folderShellKey}\\command" /ve /t REG_SZ /d "\\"${exePath}\\" \\"--hide\\" \\"%1\\"" /f`;

    exec(cmd, { windowsHide: true }, () => {});
  } catch (_) {}
}

autoRegisterContextMenu();

// ═════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═════════════════════════════════════════════════════════════════════════════

app.get('/api/auth/status', (req, res) => {
  const db = readDB();
  res.json({
    isSetup: !!db.auth.isSetup,
    q1: db.auth.q1 || 'What was the name of your first school?',
    q2: db.auth.q2 || 'What is your favorite pet or childhood nickname?'
  });
});

app.post('/api/auth/setup', (req, res) => {
  const { password, q1, a1, q2, a2, forceReset } = req.body;
  if (!password || password.length < 4)
    return res.status(400).json({ error: 'Master key must be at least 4 characters.' });

  const db = readDB();
  if (db.auth.isSetup && !forceReset)
    return res.status(400).json({ error: 'Master key already configured.' });

  const salt         = crypto.randomBytes(16).toString('hex');
  db.auth.salt       = salt;
  db.auth.masterHash = hashPassword(password, salt);
  db.auth.isSetup    = true;

  if (q1 && a1) {
    db.auth.q1     = q1.trim();
    db.auth.a1Hash = hashAnswer(a1, salt);
  }
  if (q2 && a2) {
    db.auth.q2     = q2.trim();
    db.auth.a2Hash = hashAnswer(a2, salt);
  }

  addLog(db, forceReset ? 'RESET_MASTER_KEY' : 'SETUP_MASTER_KEY', 'SYSTEM', true);
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required.' });

  const db = readDB();
  if (!db.auth.isSetup)
    return res.status(400).json({ error: 'Vault not initialised yet.' });

  if (hashPassword(password, db.auth.salt) === db.auth.masterHash) {
    addLog(db, 'LOGIN_SUCCESS', 'SYSTEM', true);
    writeDB(db);
    res.json({ success: true });
  } else {
    addLog(db, 'LOGIN_FAILED', 'SYSTEM', false, 'Wrong master key');
    writeDB(db);
    res.status(401).json({ error: 'Incorrect Master Key.' });
  }
});

// ── Security Question Password Recovery ────────────────────────────────────────
app.post('/api/auth/recover', (req, res) => {
  const { a1, a2, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: 'New Master key must be at least 4 characters.' });

  const db = readDB();
  if (!db.auth.isSetup)
    return res.status(400).json({ error: 'Vault is not set up.' });

  if (!db.auth.a1Hash || !db.auth.a2Hash)
    return res.status(400).json({ error: 'Security questions were not configured during setup.' });

  const checkA1 = hashAnswer(a1, db.auth.salt);
  const checkA2 = hashAnswer(a2, db.auth.salt);

  if (checkA1 === db.auth.a1Hash && checkA2 === db.auth.a2Hash) {
    // Correct answers! Reset Master Key
    const newSalt      = crypto.randomBytes(16).toString('hex');
    db.auth.salt       = newSalt;
    db.auth.masterHash = hashPassword(newPassword, newSalt);
    db.auth.a1Hash     = hashAnswer(a1, newSalt);
    db.auth.a2Hash     = hashAnswer(a2, newSalt);

    addLog(db, 'RESET_MASTER_KEY_VIA_RECOVERY', 'SYSTEM', true);
    writeDB(db);
    res.json({ success: true });
  } else {
    addLog(db, 'RECOVERY_FAILED', 'SYSTEM', false, 'Incorrect security answers');
    writeDB(db);
    res.status(401).json({ error: 'Incorrect answers to security questions.' });
  }
});

app.post('/api/system/pick-file', async (req, res) => {
  try {
    const p = await pickFile();
    if (p && fs.existsSync(p)) return res.json({ success: true, path: p });
    res.json({ success: false, path: null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/system/pick-folder', async (req, res) => {
  try {
    const p = await pickFolder();
    if (p && fs.existsSync(p)) return res.json({ success: true, path: p });
    res.json({ success: false, path: null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/vault', (req, res) => {
  const db = readDB();
  res.json({ items: db.items, logs: db.logs });
});

app.post('/api/vault/add', (req, res) => {
  const { targetPath } = req.body;
  if (!targetPath || !targetPath.trim())
    return res.status(400).json({ error: 'Path is required.' });

  const clean = path.normalize(targetPath.trim());
  const db    = readDB();

  if (db.items.some(i => i.itemPath.toLowerCase() === clean.toLowerCase()))
    return res.status(400).json({ error: 'Item already exists in list.' });

  let isDir = false;
  try { isDir = fs.existsSync(clean) && fs.statSync(clean).isDirectory(); } catch (_) {}

  const newItem = {
    id:          'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name:        path.basename(clean) || clean,
    itemPath:    clean,
    isDirectory: isDir,
    isHidden:    false,
    dateAdded:   new Date().toISOString()
  };

  db.items.unshift(newItem);
  addLog(db, 'ADD_ITEM', clean, true, isDir ? 'folder' : 'file');
  writeDB(db);
  res.json({ success: true, item: newItem });
});

app.post('/api/vault/add-and-hide', async (req, res) => {
  const { targetPath } = req.body;
  if (!targetPath || !targetPath.trim())
    return res.status(400).json({ error: 'Path is required.' });

  const clean = path.normalize(targetPath.trim());
  const db    = readDB();

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

  const success = await applyHide(clean);
  if (success) item.isHidden = true;

  addLog(db, 'CONTEXT_MENU_HIDE', clean, success);
  writeDB(db);
  res.json({ success: true, item });
});

app.post('/api/system/context-menu', (req, res) => {
  const { action } = req.body;
  const scriptPath = path.join(__dirname, 'context_menu.ps1');
  const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Action "${action || 'register'}"`;
  exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
    if (err) {
      res.status(500).json({ success: false, error: (stderr || err.message).trim() });
    } else {
      res.json({ success: true, output: stdout.trim() });
    }
  });
});

app.post('/api/vault/toggle-hide', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Item ID required.' });

  const db   = readDB();
  const item = db.items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const wasHidden = item.isHidden;
  let success     = false;

  if (wasHidden) {
    success = await applyUnhide(item.itemPath);
    if (success) item.isHidden = false;
  } else {
    success = await applyHide(item.itemPath);
    if (success) item.isHidden = true;
  }

  addLog(db, wasHidden ? 'UNHIDE_ITEM' : 'HIDE_ITEM', item.itemPath, success);
  writeDB(db);

  if (success) {
    res.json({ success: true, isHidden: item.isHidden });
  } else {
    res.status(500).json({ error: 'Failed to change visibility attribute.' });
  }
});

app.post('/api/vault/remove', async (req, res) => {
  const { id, restoreAccess } = req.body;
  if (!id) return res.status(400).json({ error: 'Item ID required.' });

  const db    = readDB();
  const index = db.items.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: 'Item not found.' });

  const item = db.items[index];

  if (restoreAccess && item.isHidden) {
    await applyUnhide(item.itemPath);
  }

  db.items.splice(index, 1);
  addLog(db, 'REMOVE_ITEM', item.itemPath, true);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/system/stats', (req, res) => {
  const db     = readDB();
  const total  = db.items.length;
  const hidden = db.items.filter(i => i.isHidden).length;
  const score  = total === 0
    ? 100
    : Math.max(0, Math.round(100 - ((total - hidden) / total) * 50));

  res.json({ totalItems: total, hiddenItems: hidden, securityScore: score });
});

const server = app.listen(PORT, () => {
  console.log(`[Orbit Hide] Server → http://localhost:${PORT}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Orbit Hide] Port ${PORT} already in use.`);
  } else {
    console.error('[Orbit Hide] Server error:', err);
  }
});
