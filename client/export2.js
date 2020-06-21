const electronInstaller = require('electron-winstaller');

const path = require('path');

const APP_DIR = path.resolve(__dirname, './dist/win-unpacked');

const OUT_DIR = path.resolve(__dirname, './dist/windows_installer');


resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: APP_DIR,
  outputDirectory: OUT_DIR,
  authors: 'Lakerolmaker',
  exe: 'NewDiscord.exe'
});

console.log("Packaging the program")
resultPromise.then(() => {
  console.log("The installers of your application were succesfully created !");
}, (e) => {
  console.log(`Well, sometimes you are not so lucky: ${e.message}`)
});
