# Orbit Hide — Stealth Windows File & Folder Protection

<div align="center">

  <img src="public/logo.png" alt="Orbit Hide Logo" width="110" height="110">

  # 🛡️ ORBIT HIDE
  **Ultra-Fast, Zero Data-Loss Stealth Hiding for Windows Files & Folders**

  [![Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/sachinmandawi/orbit-hide)
  [![Security](https://img.shields.io/badge/Security-PBKDF2--SHA512-success?style=for-the-badge&logo=securityScorecard&logoColor=white)](https://github.com/sachinmandawi/orbit-hide)
  [![Offline](https://img.shields.io/badge/Privacy-100%25%20Offline-orange?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/sachinmandawi/orbit-hide)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  ---

  <p align="center">
    <b>Orbit Hide</b> is a state-of-the-art local security utility designed to instantly hide sensitive files and folders in Windows File Explorer using kernel-level stealth attributes (<code>+h +s</code>), 100% offline security, and seamless right-click context menu integration.
  </p>

</div>

---

## 🌟 Key Features

### 👁️ Stealth Attribute Protection (`+h +s`)
Unlike risky encryption tools that modify your file contents, **Orbit Hide** applies Windows Kernel-Level **System (`+s`)** and **Hidden (`+h`)** flags.
* **0% Data Corruption:** Original photos, videos, documents, and archives remain 100% untouched.
* **Instant Speed:** Hides and unhides files/folders in under **50 milliseconds**.

### 🖱️ Right-Click Windows Explorer Integration
Right-click any file or folder in Windows Explorer and click **`Hide with Orbit Hide`**.
* **Pure Stealth Hiding:** Executes 100% silently in the background with **zero window popups**.
* **Zero Configuration:** Automatically registers into Windows Registry (`HKCU`) on first launch — no admin prompt required.

### 🔑 Master Key & Security Questions Recovery
* **PBKDF2 + SHA-512 Hashing:** Your master key is hashed with 100,000 iterations + 16-byte random salt.
* **Security Questions Recovery:** Forgot your password? Answer 2 secret security questions to reset your master key instantly.

### 🛡️ 100% Offline & Local Vault
* No internet access, no cloud sync, no tracking.
* All configuration stays 100% locally inside `%APPDATA%\Orbit Hide\vault_db.json`.

---

## 📊 Feature Matrix

| Feature | Orbit Hide | Standard Encryption | Basic Windows Hide |
| :--- | :---: | :---: | :---: |
| **Data Safety (0% Corruption Risk)** | ✅ **100% Safe** | ⚠️ File Risk | ✅ Safe |
| **Speed** | ⚡ **Instant (<50ms)** | 🐢 Slow (Re-encrypts) | ⚡ Instant |
| **Right-Click Stealth Menu** | ✅ **Included** | ❌ No | ❌ No |
| **Zero Window Popups** | ✅ **Pure Stealth** | ❌ No | ❌ No |
| **Offline Security** | 🔒 **100% Offline** | ⚠️ Varies | 🔒 Local |
| **Password Recovery (Q&A)** | ✅ **Included** | ❌ Hard | ❌ No |

---

## 📦 Downloads & Installation

Download the latest version directly from the [GitHub Releases](https://github.com/sachinmandawi/orbit-hide/releases) page:

* 🚀 **[Orbit Hide Setup 1.0.0.exe](https://github.com/sachinmandawi/orbit-hide/releases/download/v1.0.0/Orbit.Hide.Setup.1.0.0.exe)** — Official Windows Installer.
* 📦 **[Orbit Hide 1.0.0.exe](https://github.com/sachinmandawi/orbit-hide/releases/download/v1.0.0/Orbit.Hide.1.0.0.exe)** — Portable Executable (No installation required).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + K` | Focus search bar to instantly find any item in vault |
| `Ctrl + \` | Toggle sidebar collapse/expand |
| `Enter` | Submit login or password recovery form |

---

## 🛠️ Tech Stack & Architecture

* **Desktop Framework:** Electron.js v43
* **Backend Server:** Node.js Express REST API
* **Security Hashing:** PBKDF2 with SHA-512 & Salt (Crypto module)
* **OS Engine:** Windows Native Attributes (`attrib +h +s` / `attrib -h -s`)
* **Registry Integration:** Windows HKCU Shell Commands (`reg.exe`)

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for Privacy &amp; Security</sub>
</div>
