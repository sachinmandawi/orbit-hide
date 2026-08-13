# Orbit Hide Windows Context Menu Registrar (HKCU - No Admin required)
param (
    [string]$Action = "register",
    [string]$ExePath = "d:\Orbit Lock\dist\win-unpacked\Orbit Hide.exe"
)

$fileShellKey   = "HKCU:\Software\Classes\*\shell\OrbitHide"
$dirShellKey    = "HKCU:\Software\Classes\Directory\shell\OrbitHide"
$folderShellKey = "HKCU:\Software\Classes\Folder\shell\OrbitHide"

# Clean old keys if present
$oldFile = "HKCU:\Software\Classes\*\shell\OrbitLock"
$oldDir  = "HKCU:\Software\Classes\Directory\shell\OrbitLock"
$oldFold = "HKCU:\Software\Classes\Folder\shell\OrbitLock"

if ($Action -eq "register") {
    Write-Host "Registering 'Hide with Orbit Hide' in Windows Context Menu..."
    
    if (Test-Path $oldFile) { Remove-Item -Path $oldFile -Recurse -Force }
    if (Test-Path $oldDir)  { Remove-Item -Path $oldDir -Recurse -Force }
    if (Test-Path $oldFold) { Remove-Item -Path $oldFold -Recurse -Force }

    # 1. Register for Files (*)
    New-Item -Path $fileShellKey -Force | Out-Null
    Set-ItemProperty -Path $fileShellKey -Name "(default)" -Value "Hide with Orbit Hide"
    Set-ItemProperty -Path $fileShellKey -Name "Icon" -Value "`"$ExePath`""
    New-Item -Path "$fileShellKey\command" -Force | Out-Null
    Set-ItemProperty -Path "$fileShellKey\command" -Name "(default)" -Value "`"$ExePath`" `"--hide`" `"%1`""

    # 2. Register for Directories
    New-Item -Path $dirShellKey -Force | Out-Null
    Set-ItemProperty -Path $dirShellKey -Name "(default)" -Value "Hide with Orbit Hide"
    Set-ItemProperty -Path $dirShellKey -Name "Icon" -Value "`"$ExePath`""
    New-Item -Path "$dirShellKey\command" -Force | Out-Null
    Set-ItemProperty -Path "$dirShellKey\command" -Name "(default)" -Value "`"$ExePath`" `"--hide`" `"%1`""

    # 3. Register for Folders
    New-Item -Path $folderShellKey -Force | Out-Null
    Set-ItemProperty -Path $folderShellKey -Name "(default)" -Value "Hide with Orbit Hide"
    Set-ItemProperty -Path $folderShellKey -Name "Icon" -Value "`"$ExePath`""
    New-Item -Path "$folderShellKey\command" -Force | Out-Null
    Set-ItemProperty -Path "$folderShellKey\command" -Name "(default)" -Value "`"$ExePath`" `"--hide`" `"%1`""

    Write-Host "Context menu successfully registered! ✓"
}
elseif ($Action -eq "unregister") {
    Write-Host "Unregistering 'Hide with Orbit Hide' from Context Menu..."
    
    if (Test-Path $fileShellKey)   { Remove-Item -Path $fileShellKey -Recurse -Force }
    if (Test-Path $dirShellKey)    { Remove-Item -Path $dirShellKey -Recurse -Force }
    if (Test-Path $folderShellKey) { Remove-Item -Path $folderShellKey -Recurse -Force }
    
    Write-Host "Context menu successfully unregistered! ✓"
}
