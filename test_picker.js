const { exec } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'picker.ps1');
console.log('Testing picker script at:', scriptPath);

exec(`powershell -NoProfile -ExecutionPolicy Bypass -sta -File "${scriptPath}"`, (error, stdout, stderr) => {
  console.log('Error:', error);
  console.log('Stdout:', stdout);
  console.log('Stderr:', stderr);
});
