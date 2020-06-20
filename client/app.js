const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron') // http://electronjs.org/docs/api
const path = require('path') // https://nodejs.org/api/path.html
const url = require('url') // https://nodejs.org/api/url.html
const io = require('socket.io')
const showDialog = require('./show-dialog');
const Store = require('./store.js');
//require('update-electron-app')()

console.log("Hewwo Uwu")


// First instantiate the class
const store = new Store({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: {
      width: 1100,
      height: 650
    }
  }
});

// Wait until the app is ready
app.once('ready', () => {

  let {
    width,
    height
  } = store.get('windowBounds');

  window = new BrowserWindow({
    // Set the initial width to 400px
    width: width,
    // Set the initial height to 500px
    height: height,
    // Don't show the window until it ready, this prevents any white flickering
    show: false,
    // Don't allow the window to be resized.
    resizable: true,

    minHeight: 650,

    minWidth: 1100,

    frame: true,

    webPreferences: {
     nodeIntegration: false, // is default value after Electron v5
     contextIsolation: true, // protect against prototype pollution
     enableRemoteModule: false, // turn off remote
     preload: path.join(__dirname, "preload.js") // use a preload script
   }

  })

  // Load a URL in the window to the local index.html path
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  window.openDevTools({
    mode: 'right'
  });


  // Show window when page is ready
  window.once('ready-to-show', () => {
    //window.maximize()
    window.setMenuBarVisibility(false)
    window.show()
  })

  //: Stores the window size of the window. so that the window is the same size when opened
  window.on('resize', () => {
    let {
      width,
      height
    } = window.getBounds();
    // Now that we have them, save them using the `set` method.
    store.set('windowBounds', {
      width,
      height
    });
  });


  ipcMain.on('set_display_name', (event, arg)  => {
    store.set('display_name', arg);
  });

  ipcMain.on('get_display_name', (event, arg) => {

    event.reply('recive_display_name', store.get("display_name"))
  })

})
