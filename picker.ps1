[System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null
$OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$OpenFileDialog.Title = "Select File or Folder for Orbit Lock"
$OpenFileDialog.Filter = "All Items (*.*)|*.*"
$OpenFileDialog.CheckFileExists = $false
$OpenFileDialog.CheckPathExists = $true
$OpenFileDialog.FileName = "Select Folder or File Here"

# Force TopMost Form Wrapper so Explorer dialog pops up over Chrome/Edge
$topForm = New-Object System.Windows.Forms.Form
$topForm.TopMost = $true
$topForm.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$topForm.Location = New-Object System.Drawing.Point(-2000, -2000)
$topForm.Size = New-Object System.Drawing.Size(1, 1)
$topForm.Show()
$topForm.BringToFront()

$result = $OpenFileDialog.ShowDialog($topForm)
$topForm.Close()
$topForm.Dispose()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    $sel = $OpenFileDialog.FileName
    if ($sel.EndsWith("Select Folder or File Here")) {
        $sel = [System.IO.Path]::GetDirectoryName($sel)
    }
    Write-Host $sel
}