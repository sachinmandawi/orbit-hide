/* ================================================================
   Orbit Hide — Hide & Protect Application Controller
   ================================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────────
const state = {
  items:       [],
  logs:        [],
  currentView: 'dashboard',
  searchQuery: '',
  authMode:    'signin',  // 'signin' | 'create' | 'recovery'
  q1Text:      '',
  q2Text:      ''
};

// ── DOM refs ──────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const sidebar            = $('sidebar');
const collapseSidebarBtn = $('collapse-sidebar-btn');
const expandSidebarBtn   = $('expand-sidebar-btn');
const logoutBtn          = $('logout-btn');

const authTitle             = $('auth-screen-title');
const authDesc              = $('auth-screen-desc');
const authPasswordInput     = $('auth-password-input');
const authConfirmInput      = $('auth-confirm-input');
const confirmPwdGroup       = $('confirm-pwd-group');
const secQuestionsSetupGroup= $('security-questions-setup-group');
const q1Select              = $('q1-select');
const a1Input               = $('a1-input');
const q2Select              = $('q2-select');
const a2Input               = $('a2-input');
const authSubmitBtn         = $('auth-submit-btn');
const togglePwdBtn          = $('toggle-pwd-visibility-btn');
const tabSigninBtn          = $('tab-signin-btn');
const tabCreateBtn          = $('tab-create-btn');

const authFormBody          = $('auth-form-body');
const recoveryFormBody      = $('recovery-form-body');
const forgotPwdLink         = $('forgot-pwd-link');
const backToSigninLink      = $('back-to-signin-link');
const recQ1Label            = $('rec-q1-label');
const recA1Input            = $('rec-a1-input');
const recQ2Label            = $('rec-q2-label');
const recA2Input            = $('rec-a2-input');
const recNewPwdInput        = $('rec-new-pwd-input');
const recConfirmPwdInput    = $('rec-confirm-pwd-input');
const recoverySubmitBtn     = $('recovery-submit-btn');

const addFileBtn            = $('add-file-btn');
const addFolderBtn          = $('add-folder-btn');
const vaultTbody            = $('vault-items-tbody');
const logsTbody             = $('logs-tbody');
const emptyStateMsg         = $('empty-state-msg');
const searchInput           = $('search-input');
const toastContainer        = $('toast-container');

// ── Boot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await checkAuthStatus();
});

// ── Event Wiring ─────────────────────────────────────────────────
function setupEventListeners() {



  if (collapseSidebarBtn) collapseSidebarBtn.addEventListener('click', toggleSidebar);
  if (expandSidebarBtn)   expandSidebarBtn.addEventListener('click',   toggleSidebar);

  if (tabSigninBtn) tabSigninBtn.addEventListener('click', () => switchAuthTab('signin'));
  if (tabCreateBtn) tabCreateBtn.addEventListener('click', () => switchAuthTab('create'));

  if (forgotPwdLink) {
    forgotPwdLink.addEventListener('click', e => {
      e.preventDefault();
      switchAuthTab('recovery');
    });
  }

  if (backToSigninLink) {
    backToSigninLink.addEventListener('click', e => {
      e.preventDefault();
      switchAuthTab('signin');
    });
  }

  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', () => {
      const show = authPasswordInput.type === 'password';
      authPasswordInput.type = show ? 'text' : 'password';
      if (authConfirmInput) authConfirmInput.type = show ? 'text' : 'password';
      togglePwdBtn.style.color = show ? 'var(--notion-blue)' : '';
    });
  }

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => switchView(el.getAttribute('data-view')));
  });

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderVaultItems();
    });
  }

  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
    if (mod && e.key === '\\') {
      e.preventDefault();
      toggleSidebar();
    }
    if (e.key === 'Enter' && document.activeElement === authPasswordInput) handleAuthSubmit();
    if (e.key === 'Enter' && document.activeElement === authConfirmInput)  handleAuthSubmit();
    if (e.key === 'Enter' && document.activeElement === recConfirmPwdInput) handleRecoverySubmit();
  });

  if (authSubmitBtn)     authSubmitBtn.addEventListener('click', handleAuthSubmit);
  if (recoverySubmitBtn) recoverySubmitBtn.addEventListener('click', handleRecoverySubmit);

  const pwdToggle = $('enable-pwd-toggle');
  if (pwdToggle) pwdToggle.addEventListener('change', handleToggleSecurity);

  const saveSecBtn = $('save-security-btn');
  if (saveSecBtn) saveSecBtn.addEventListener('click', handleSaveSecuritySettings);

  const lockNowBtn = $('lock-now-btn');
  if (lockNowBtn) lockNowBtn.addEventListener('click', handleLockVault);

  const toggleSecPwdBtn = $('toggle-sec-pwd-btn');
  const secPwdInput     = $('sec-master-pwd-input');
  if (toggleSecPwdBtn && secPwdInput) {
    toggleSecPwdBtn.addEventListener('click', () => {
      const show = secPwdInput.type === 'password';
      secPwdInput.type = show ? 'text' : 'password';
      toggleSecPwdBtn.style.color = show ? 'var(--notion-blue)' : '';
    });
  }

  const toggleTokenBtn = $('toggle-token-visibility-btn');
  const tokenInput    = $('github-token-input');
  if (toggleTokenBtn && tokenInput) {
    toggleTokenBtn.addEventListener('click', () => {
      const show = tokenInput.type === 'password';
      tokenInput.type = show ? 'text' : 'password';
      toggleTokenBtn.style.color = show ? 'var(--notion-blue)' : '';
    });
  }

  const saveCloudBtn = $('save-cloud-settings-btn');
  if (saveCloudBtn) saveCloudBtn.addEventListener('click', handleSaveCloudSettings);

  const manualSyncBtn = $('manual-sync-btn');
  if (manualSyncBtn) manualSyncBtn.addEventListener('click', handleManualSync);

  const restoreCloudBtn = $('restore-cloud-btn');
  if (restoreCloudBtn) restoreCloudBtn.addEventListener('click', handleRestoreCloud);

  const disconnectCloudBtn = $('disconnect-cloud-btn');
  if (disconnectCloudBtn) disconnectCloudBtn.addEventListener('click', handleDisconnectCloud);

  // ── Add File ────────────────────────────────────────────────────
  if (addFileBtn) {
    addFileBtn.addEventListener('click', async () => {
      let picked = null;

      try {
        if (typeof window !== 'undefined' && window.require) {
          const { ipcRenderer } = window.require('electron');
          picked = await ipcRenderer.invoke('select-file-item');
        }
      } catch (_) {}

      if (!picked) {
        try {
          const r = await fetch('/api/system/pick-file', { method: 'POST' });
          const d = await r.json();
          if (d.success && d.path) picked = d.path;
        } catch (_) {}
      }

      if (!picked) {
        picked = prompt('Enter the full file path to protect:\nExample: C:\\Users\\smand\\Desktop\\photo.png');
      }

      if (picked && picked.trim()) await addPathToVault(picked.trim());
    });
  }

  // ── Add Folder ──────────────────────────────────────────────────
  if (addFolderBtn) {
    addFolderBtn.addEventListener('click', async () => {
      let picked = null;

      try {
        if (typeof window !== 'undefined' && window.require) {
          const { ipcRenderer } = window.require('electron');
          picked = await ipcRenderer.invoke('select-folder-item');
        }
      } catch (_) {}

      if (!picked) {
        try {
          const r = await fetch('/api/system/pick-folder', { method: 'POST' });
          const d = await r.json();
          if (d.success && d.path) picked = d.path;
        } catch (_) {}
      }

      if (!picked) {
        picked = prompt('Enter the full folder path to protect:\nExample: D:\\MyPrivateFolder');
      }

      if (picked && picked.trim()) await addPathToVault(picked.trim());
    });
  }
}

// ── Sidebar ───────────────────────────────────────────────────────
function toggleSidebar() {
  if (!sidebar) return;
  const willCollapse = !sidebar.classList.contains('collapsed');
  sidebar.classList.toggle('collapsed', willCollapse);

  if (expandSidebarBtn) {
    expandSidebarBtn.style.display = willCollapse ? 'flex' : 'none';
  }
}

// ── Auth Tab Switch ───────────────────────────────────────────────
function switchAuthTab(mode) {
  state.authMode = mode;
  const isSignin   = (mode === 'signin');
  const isCreate   = (mode === 'create');
  const isRecovery = (mode === 'recovery');

  if (authFormBody)     authFormBody.style.display     = isRecovery ? 'none' : 'block';
  if (recoveryFormBody) recoveryFormBody.style.display = isRecovery ? 'block' : 'none';

  tabSigninBtn && tabSigninBtn.classList.toggle('active',  isSignin);
  tabCreateBtn && tabCreateBtn.classList.toggle('active', isCreate);

  if (authTitle) {
    if (isSignin)   authTitle.textContent = 'Sign In to Orbit Hide';
    if (isCreate)   authTitle.textContent = 'Create Master Key';
    if (isRecovery) authTitle.textContent = 'Reset Master Key';
  }

  if (authDesc) {
    if (isSignin)   authDesc.textContent = 'Enter master key to unlock your local security vault.';
    if (isCreate)   authDesc.textContent = 'Create a master key & set security questions.';
    if (isRecovery) authDesc.textContent = 'Answer security questions to reset your master key.';
  }

  if (authSubmitBtn)          authSubmitBtn.textContent = isSignin ? 'Sign In & Unlock Vault' : 'Create Master Key';
  if (confirmPwdGroup)        confirmPwdGroup.style.display = isCreate ? 'block' : 'none';
  if (secQuestionsSetupGroup) secQuestionsSetupGroup.style.display = isCreate ? 'block' : 'none';

  if (isRecovery) {
    if (recQ1Label) recQ1Label.textContent = state.q1Text || 'What was the name of your first school?';
    if (recQ2Label) recQ2Label.textContent = state.q2Text || 'What is your favorite pet or childhood nickname?';
  }

  if (authPasswordInput) { authPasswordInput.value = ''; authPasswordInput.focus(); }
  if (authConfirmInput)  authConfirmInput.value = '';
}

// ── Lock Vault ───────────────────────────────────────────────────
function handleLogout() {
  handleLockVault();
}

async function handleLockVault() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();

    if (!data.isSetup || !data.enabled) {
      showToast('Password protection is currently disabled. Enable it in Password & Security sidebar tab first.', 'error');
      localStorage.removeItem('orbit_hide_locked');
      document.documentElement.classList.remove('is-locked');
      const authScreen = $('auth-screen');
      if (authScreen) authScreen.style.display = 'none';
      return;
    }

    localStorage.setItem('orbit_hide_locked', 'true');
    document.documentElement.classList.add('is-locked');
    const authScreen = $('auth-screen');
    if (authScreen) authScreen.style.display = 'flex';
    switchAuthTab('signin');
    if (authPasswordInput) {
      authPasswordInput.value = '';
      authPasswordInput.focus();
    }
    showToast('Vault locked. Enter master key to unlock.', 'info');
  } catch (_) {
    showToast('Failed to verify auth status.', 'error');
  }
}

// ── Auth Status Check (Run on Software Start) ────────────────────
async function checkAuthStatus() {
  try {
    const res  = await fetch('/api/auth/status');
    const data = await res.json();

    state.q1Text = data.q1 || 'What was the name of your first school?';
    state.q2Text = data.q2 || 'What is your favorite pet or childhood nickname?';

    if (data.enabled && data.isSetup) {
      // Password protection enabled: require Master Key on software boot
      document.documentElement.classList.add('is-locked');
      const authScreen = $('auth-screen');
      if (authScreen) authScreen.style.display = 'flex';
      switchAuthTab('signin');
      if (authPasswordInput) {
        authPasswordInput.value = '';
        authPasswordInput.focus();
      }
    } else {
      // Password protection disabled: boot directly into Dashboard
      document.documentElement.classList.remove('is-locked');
      const authScreen = $('auth-screen');
      if (authScreen) authScreen.style.display = 'none';
      await loadVaultData();
    }
  } catch (_) {
    showToast('Cannot connect to Orbit Hide server. Please restart.', 'error');
  }
}

// ── Auth Submit (Unlock) ──────────────────────────────────────────
async function handleAuthSubmit() {
  const password = authPasswordInput ? authPasswordInput.value.trim() : '';
  if (!password) { showToast('Please enter a master key.', 'error'); return; }

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.removeItem('orbit_hide_locked');
      document.documentElement.classList.remove('is-locked');
      if (authPasswordInput) authPasswordInput.value = '';
      showToast('Vault unlocked!', 'success');
      await loadVaultData();
    } else {
      showToast(data.error || 'Incorrect Master Key.', 'error');
    }
  } catch (_) {
    showToast('Network error during unlock.', 'error');
  }
}

// ── Security Question Password Reset Handler ────────────────────────
async function handleRecoverySubmit() {
  const a1          = recA1Input         ? recA1Input.value.trim()         : '';
  const a2          = recA2Input         ? recA2Input.value.trim()         : '';
  const newPassword = recNewPwdInput     ? recNewPwdInput.value.trim()     : '';
  const confirmPwd  = recConfirmPwdInput ? recConfirmPwdInput.value.trim() : '';

  if (!a1 || !a2) {
    showToast('Please answer both security questions.', 'error');
    return;
  }
  if (!newPassword || newPassword.length < 4) {
    showToast('New Master key must be at least 4 characters.', 'error');
    return;
  }
  if (newPassword !== confirmPwd) {
    showToast('New passwords do not match.', 'error');
    return;
  }

  try {
    const res  = await fetch('/api/auth/recover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ a1, a2, newPassword })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.removeItem('orbit_hide_locked');
      document.documentElement.classList.remove('is-locked');
      showToast('Master Key reset successfully! Vault unlocked.', 'success');
      if (recA1Input)          recA1Input.value          = '';
      if (recA2Input)          recA2Input.value          = '';
      if (recNewPwdInput)      recNewPwdInput.value      = '';
      if (recConfirmPwdInput)  recConfirmPwdInput.value  = '';
      await checkAuthStatus();
      await loadVaultData();
    } else {
      showToast(data.error || 'Incorrect answers to security questions.', 'error');
    }
  } catch (_) {
    showToast('Network error during password recovery.', 'error');
  }
}

// ── Add Path to Vault ─────────────────────────────────────────────
async function addPathToVault(targetPath) {
  try {
    const res  = await fetch('/api/vault/add', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetPath })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`"${data.item.name}" added to list.`, 'success');
      await loadVaultData();
    } else {
      showToast(data.error || 'Failed to add item.', 'error');
    }
  } catch (_) {
    showToast('Network error while adding item.', 'error');
  }
}

// ── Load Vault Data ───────────────────────────────────────────────
async function loadVaultData() {
  try {
    const [vr, sr] = await Promise.all([
      fetch('/api/vault'),
      fetch('/api/system/stats')
    ]);
    const vaultData = await vr.json();
    const statsData = await sr.json();

    state.items = vaultData.items || [];
    state.logs  = vaultData.logs  || [];

    const totalEl  = $('nav-count-total');
    const hiddenEl = $('nav-count-hidden');
    if (totalEl)  totalEl.textContent  = statsData.totalItems ?? 0;
    if (hiddenEl) hiddenEl.textContent = statsData.hiddenItems ?? 0;

    renderVaultItems();
    renderLogs();
  } catch (_) {
    showToast('Failed to load vault data. Please check the server.', 'error');
  }
}

// ── Switch View ───────────────────────────────────────────────────
function switchView(view) {
  if (!view) return;
  state.currentView = view;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-view') === view);
  });

  const dashContent     = $('view-dashboard-content');
  const logsContent     = $('view-logs-content');
  const securityContent = $('view-security-content');
  const settingsContent = $('view-settings-content');
  const heading         = $('view-heading');

  const labels = {
    dashboard: 'Vault Overview',
    hidden:    'Hidden Items',
    logs:      'Security Audit Logs',
    security:  'Password & Security',
    settings:  'GitHub Sync'
  };

  if (dashContent)     dashContent.style.display     = (view === 'dashboard' || view === 'hidden') ? 'block' : 'none';
  if (logsContent)     logsContent.style.display     = (view === 'logs') ? 'block' : 'none';
  if (securityContent) securityContent.style.display = (view === 'security') ? 'block' : 'none';
  if (settingsContent) settingsContent.style.display = (view === 'settings') ? 'block' : 'none';

  if (heading && labels[view]) heading.textContent = labels[view];

  if (view === 'security') loadSecurityStatus();
  if (view === 'settings') loadCloudStatus();

  renderVaultItems();
}

// ── Password & Security Controllers ─────────────────────────────────
async function loadSecurityStatus() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();

    const pwdToggle = $('enable-pwd-toggle');
    if (pwdToggle) pwdToggle.checked = !!data.enabled;
  } catch (_) {}
}

async function handleToggleSecurity(e) {
  const enabled = e.target.checked;
  try {
    const res = await fetch('/api/auth/toggle-protection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (!enabled) {
        localStorage.removeItem('orbit_hide_locked');
        document.documentElement.classList.remove('is-locked');
        const authScreen = $('auth-screen');
        if (authScreen) authScreen.style.display = 'none';
      }
      showToast(enabled ? '🔒 Vault password protection enabled.' : '🔓 Password protection disabled.', 'info');
    } else {
      e.target.checked = !enabled;
      showToast(data.error || 'Please set a master key first before enabling password protection.', 'error');
    }
  } catch (_) {
    e.target.checked = !enabled;
    showToast('Network error while updating security state.', 'error');
  }
}

async function handleSaveSecuritySettings() {
  const pwdInput     = $('sec-master-pwd-input');
  const confirmInput = $('sec-confirm-pwd-input');
  const q1Select     = $('sec-q1-select');
  const a1Input      = $('sec-a1-input');
  const q2Select     = $('sec-q2-select');
  const a2Input      = $('sec-a2-input');

  const password = pwdInput ? pwdInput.value.trim() : '';
  const confirm  = confirmInput ? confirmInput.value.trim() : '';
  const q1       = q1Select ? q1Select.value : '';
  const a1       = a1Input ? a1Input.value.trim() : '';
  const q2       = q2Select ? q2Select.value : '';
  const a2       = a2Input ? a2Input.value.trim() : '';

  if (!password || password.length < 4) {
    showToast('Master Key must be at least 4 characters.', 'error');
    return;
  }
  if (password !== confirm) {
    showToast('Master Key confirmation does not match.', 'error');
    return;
  }
  if (!a1 || !a2) {
    showToast('Please answer both security questions for password recovery.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, q1, a1, q2, a2 })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('🔒 Master Key & Security Questions saved!', 'success');
      pwdInput.value = '';
      confirmInput.value = '';
      await loadSecurityStatus();
    } else {
      showToast(data.error || 'Failed to update security settings.', 'error');
    }
  } catch (_) {
    showToast('Network error while saving security settings.', 'error');
  }
}

// ── Cloud Sync Controllers ─────────────────────────────────────────
async function loadCloudStatus() {
  try {
    const res = await fetch('/api/cloud/status');
    const data = await res.json();

    const pillDot    = $('cloud-status-dot');
    const pillText   = $('cloud-status-text');
    const infoBox    = $('cloud-info-box');
    const ownerVal   = $('cloud-owner-val');
    const repoLink   = $('cloud-repo-link');
    const lastSync   = $('cloud-lastsync-val');
    const manualBtn  = $('manual-sync-btn');
    const disconnect = $('disconnect-cloud-btn');
    const tokenInput = $('github-token-input');
    const repoInput  = $('github-repo-input');

    if (repoInput && data.repoName) repoInput.value = data.repoName;

    if (data.enabled && data.owner) {
      if (pillDot)  { pillDot.className = 'status-dot-indicator green-dot'; }
      if (pillText) { pillText.textContent = 'Connected'; }
      if (infoBox)  { infoBox.style.display = 'flex'; }
      if (ownerVal) { ownerVal.textContent = data.owner; }
      if (repoLink) {
        repoLink.textContent = 'View Repository ↗';
        repoLink.href = `https://github.com/${data.owner}/${data.repoName}`;
      }
      if (lastSync) {
        lastSync.textContent = data.lastSync ? new Date(data.lastSync).toLocaleString() : 'Never';
      }
      if (manualBtn)  { manualBtn.style.display = 'inline-flex'; }
      if (disconnect) { disconnect.style.display = 'inline-block'; }
      if (tokenInput && data.hasToken && !tokenInput.value) {
        tokenInput.placeholder = '••••••••••••••••••••••••';
      }
    } else {
      if (pillDot)  { pillDot.className = 'status-dot-indicator red-dot'; }
      if (pillText) { pillText.textContent = 'Disconnected'; }
      if (infoBox)  { infoBox.style.display = 'none'; }
      if (manualBtn)  { manualBtn.style.display = 'none'; }
      if (disconnect) { disconnect.style.display = 'none'; }
    }
  } catch (err) {
    console.error('[Cloud Status Error]:', err.message);
  }
}

async function handleSaveCloudSettings() {
  const tokenInput = $('github-token-input');
  const repoInput  = $('github-repo-input');
  const saveBtn    = $('save-cloud-settings-btn');

  const token = tokenInput ? tokenInput.value.trim() : '';
  const repoName = repoInput ? repoInput.value.trim() : 'orbit-hide-vault-backup';

  if (!token) {
    showToast('Please enter your GitHub Personal Access Token.', 'error');
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>Connecting & Creating Private Repo...</span>`;
  }

  showToast('Connecting to GitHub API & verifying repo...', 'info');

  try {
    const res = await fetch('/api/cloud/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, repoName })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`☁️ Cloud Sync connected! Private repository ${data.owner}/${data.repoName} active.`, 'success');
      tokenInput.value = '';
      await loadCloudStatus();
    } else {
      showToast(data.error || 'Failed to connect Cloud Sync.', 'error');
    }
  } catch (err) {
    showToast('Network error while connecting Cloud Sync.', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg><span>Connect & Setup Cloud Sync</span>`;
    }
  }
}

async function handleManualSync() {
  const syncBtn = $('manual-sync-btn');
  if (syncBtn) { syncBtn.disabled = true; }
  showToast('Syncing encrypted vault to GitHub...', 'info');

  try {
    const res = await fetch('/api/cloud/sync', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('☁️ Live sync completed! Vault backup updated on GitHub.', 'success');
      await loadCloudStatus();
    } else {
      showToast(data.error || 'Cloud sync failed.', 'error');
    }
  } catch (_) {
    showToast('Network error during cloud sync.', 'error');
  } finally {
    if (syncBtn) { syncBtn.disabled = false; }
  }
}

async function handleRestoreCloud() {
  const tokenInput = $('github-token-input');
  const repoInput  = $('github-repo-input');
  const restoreBtn = $('restore-cloud-btn');

  const token = tokenInput ? tokenInput.value.trim() : '';
  const repoName = repoInput ? repoInput.value.trim() : 'orbit-hide-vault-backup';

  if (restoreBtn) restoreBtn.disabled = true;
  showToast('Downloading & decrypting cloud backup from GitHub...', 'info');

  try {
    const res = await fetch('/api/cloud/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, repoName })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`☁️ Restored ${data.restoredItemsCount} items from GitHub backup!`, 'success');
      await loadVaultData();
      await loadCloudStatus();
    } else {
      showToast(data.error || 'Failed to restore vault from cloud.', 'error');
    }
  } catch (_) {
    showToast('Network error during cloud restore.', 'error');
  } finally {
    if (restoreBtn) restoreBtn.disabled = false;
  }
}

async function handleDisconnectCloud() {
  if (!confirm('Are you sure you want to disconnect GitHub Cloud Sync? Local vault items will remain intact.')) return;

  try {
    const res = await fetch('/api/cloud/disconnect', { method: 'POST' });
    if (res.ok) {
      showToast('Cloud Sync disconnected.', 'info');
      await loadCloudStatus();
    }
  } catch (_) {
    showToast('Error disconnecting Cloud Sync.', 'error');
  }
}

// ── Render Vault Items ─────────────────────────────────────────────
function renderVaultItems() {
  if (!vaultTbody) return;
  vaultTbody.innerHTML = '';

  let items = [...state.items];

  if (state.currentView === 'hidden') items = items.filter(i => i.isHidden);

  if (state.searchQuery) {
    const q = state.searchQuery;
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.itemPath.toLowerCase().includes(q)
    );
  }

  if (emptyStateMsg) emptyStateMsg.style.display = items.length === 0 ? 'flex' : 'none';

  const folderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2eaadc" stroke-width="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>`;
  const fileSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>`;

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-item-id', item.id);

    const badge = item.isHidden
      ? `<span class="badge badge-hidden">👁 Hidden</span>`
      : `<span class="badge badge-unlocked">👁️ Visible</span>`;

    const hideBtn = item.isHidden
      ? `<button class="btn btn-sm btn-unlock" onclick="toggleHide('${item.id}')">👁️ Unhide</button>`
      : `<button class="btn btn-sm btn-danger" onclick="toggleHide('${item.id}')">👁 Hide</button>`;

    const removeBtn = `<button class="btn btn-sm btn-secondary btn-remove" onclick="removeItem('${item.id}')" title="Remove from list">✕</button>`;

    tr.innerHTML = `
      <td>
        <div class="table-name-cell">
          ${item.isDirectory ? folderSvg : fileSvg}
          <span title="${esc(item.itemPath)}">${esc(item.name)}</span>
        </div>
      </td>
      <td>
        <span class="path-code" title="${esc(item.itemPath)}">${esc(item.itemPath)}</span>
      </td>
      <td>
        <div class="badge-cell">${badge}</div>
      </td>
      <td class="actions-cell">
        <div class="actions-cell-inner">
          ${hideBtn}
          ${removeBtn}
        </div>
      </td>
    `;

    vaultTbody.appendChild(tr);
  });
}

// ── Render Logs ───────────────────────────────────────────────────
function renderLogs() {
  if (!logsTbody) return;
  logsTbody.innerHTML = '';

  if (!state.logs || state.logs.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px 20px;">
      No audit events recorded yet.
    </td>`;
    logsTbody.appendChild(tr);
    return;
  }

  state.logs.forEach(log => {
    const tr   = document.createElement('tr');
    const time = (() => {
      try { return new Date(log.timestamp).toLocaleString(); }
      catch { return log.timestamp || '—'; }
    })();

    const statusCls   = log.success ? 'badge-unlocked' : 'badge-locked';
    const statusLabel = log.success ? '✓ OK' : '✗ Failed';

    tr.innerHTML = `
      <td style="color:var(--text-secondary);font-size:12px;white-space:nowrap;">${time}</td>
      <td><strong style="color:var(--notion-blue);white-space:nowrap;">${esc(log.action)}</strong></td>
      <td><span class="path-code" title="${esc(log.targetPath)}">${esc(log.targetPath)}</span></td>
      <td><span class="badge ${statusCls}">${statusLabel}</span></td>
    `;
    logsTbody.appendChild(tr);
  });
}

// ── Vault Action: Hide / Unhide ───────────────────────────────────
async function toggleHide(id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;

  const wasHidden = item.isHidden;
  setActionBtnsDisabled(id, true);

  try {
    const res  = await fetch('/api/vault/toggle-hide', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const msg = wasHidden
        ? `"${item.name}" is now visible in Explorer.`
        : `"${item.name}" is now hidden from Explorer.`;
      showToast(msg, 'success');
      await loadVaultData();
    } else {
      showToast(data.error || 'Visibility change failed.', 'error');
      setActionBtnsDisabled(id, false);
    }
  } catch (_) {
    showToast('Network error during hide/unhide.', 'error');
    setActionBtnsDisabled(id, false);
  }
}

// ── Vault Action: Remove ──────────────────────────────────────────
async function removeItem(id) {
  const item = state.items.find(i => i.id === id);
  const name = item ? `"${item.name}"` : 'this item';

  const confirmed = confirm(
    `Remove ${name} from Orbit Hide list?\n\n` +
    (item && item.isHidden ? 'Visibility attribute will be unhidden.' : '') +
    '\n\nContinue?'
  );
  if (!confirmed) return;

  try {
    const res  = await fetch('/api/vault/remove', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, restoreAccess: true })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`${name} removed from list.`, 'success');
      await loadVaultData();
    } else {
      showToast(data.error || 'Failed to remove item.', 'error');
    }
  } catch (_) {
    showToast('Network error while removing item.', 'error');
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function setActionBtnsDisabled(id, disabled) {
  if (!vaultTbody) return;
  const row = vaultTbody.querySelector(`tr[data-item-id="${id}"]`);
  if (!row) return;
  row.querySelectorAll('button').forEach(b => { b.disabled = disabled; });
}

function showToast(msg, type = 'success') {
  if (!toastContainer) return;

  const dots = {
    success: '<span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.5);display:inline-block;flex-shrink:0;"></span>',
    error:   '<span style="width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,0.5);display:inline-block;flex-shrink:0;"></span>',
    info:    '<span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;box-shadow:0 0 6px rgba(245,158,11,0.5);display:inline-block;flex-shrink:0;"></span>'
  };
  const dot = dots[type] || dots.success;

  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' toast-error' : (type === 'info' ? ' toast-info' : ' toast-success'));
  toast.innerHTML = `${dot}<span>${esc(msg)}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => { try { toast.remove(); } catch (_) {} }, 220);
  }, 2800);
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
