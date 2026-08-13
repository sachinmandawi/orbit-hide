const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const psContent = `$code = @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class NativePicker {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOMOVE = 0x0002;
    public const uint SWP_SHOWWINDOW = 0x0040;

    public static string Pick() {
        Application.EnableVisualStyles();
        OpenFileDialog dlg = new OpenFileDialog();
        dlg.Title = "Select File or Folder for Orbit Lock";
        dlg.Filter = "All Items (*.*)|*.*";
        dlg.ValidateNames = false;
        dlg.CheckFileExists = false;
        dlg.CheckPathExists = true;
        dlg.FileName = "Select Folder or File Here";

        Form dummy = new Form();
        dummy.Size = new System.Drawing.Size(1, 1);
        dummy.StartPosition = FormStartPosition.Manual;
        dummy.Location = new System.Drawing.Point(-2000, -2000);
        dummy.Show();
        dummy.BringToFront();
        SetForegroundWindow(dummy.Handle);
        SetWindowPos(dummy.Handle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);

        DialogResult res = dlg.ShowDialog(dummy);
        dummy.Close();
        dummy.Dispose();

        if (res == DialogResult.OK) {
            string sel = dlg.FileName;
            if (sel.EndsWith("Select Folder or File Here")) {
                sel = System.IO.Path.GetDirectoryName(sel);
            }
            return sel;
        }
        return "";
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Windows.Forms.dll", "System.Drawing.dll"
$path = [NativePicker]::Pick()
if ($path) { Write-Host $path }
`;

const tempPath = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'orbit_test_picker.ps1');
fs.writeFileSync(tempPath, psContent);

console.log('Spawning PowerShell picker script at:', tempPath);
exec(`powershell -NoProfile -ExecutionPolicy Bypass -sta -File "${tempPath}"`, (error, stdout, stderr) => {
  console.log('Error:', error);
  console.log('Stdout:', stdout);
  console.log('Stderr:', stderr);
});
