//window.webContents.send('message',"hello" );

const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer
} = require('electron') // http://electronjs.org/docs/api
const path = require('path') // https://nodejs.org/api/path.html
const fs = require('fs');
const url = require('url') // https://nodejs.org/api/url.html
const io = require('socket.io')
const showDialog = require('./js/show-dialog');
const Store = require('electron-store');
const imgur = require('imgur');
const isDev = require('electron-is-dev');
const macaddress = require('macaddress');
const {
  autoUpdater
} = require("electron-updater");

if (isDev) {
  console.log('Running in development');
} else {
  console.log('Running in production');
}

var mac_address;
macaddress.all().then(function(all) {
  mac_address = all.Ethernet.mac;
  console.log("Mac adress : " + mac_address)
});

console.log("Hewwo Uwu")

let api_rawdata = fs.readFileSync('apiKeys.json');
let apiKeys = JSON.parse(api_rawdata);
imgur.setClientId(apiKeys.imgur);

const store = new Store({
  configName: 'user-preferences',
  defaults: {
    windowBounds: {
      width: 1100,
      height: 650
    },
    friendList: []
  }
});
var friendList = store.get('friendList');

app.once('ready', () => {

  autoUpdater.checkForUpdatesAndNotify();

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
      preload: path.join(__dirname, "./js/preload.js") // use a preload script
    }

  })

  // Load a URL in the window to the local index.html path
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  //: opens the console if it run in development
  if (isDev) {
    window.openDevTools({
      mode: 'right'
    });
  }

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
})

ipcMain.on('set_display_name', (event, arg) => {
  store.set('display_name', arg);
});

ipcMain.on('add_friend', (event, arg) => {
  friendList.push(arg);
  store.set('friendList', friendList);
});

ipcMain.on('remove_friend', (event, arg) => {
  friendList = friendList.filter(id => id != arg);
  store.set('friendList', friendList);
});

ipcMain.on('get_user_info', (event, arg) => {
  let user = {};
  user.mac_id = mac_address;
  user.display_name = store.get("display_name")
  user.avatar_url = store.get("avatar_url")
  user.friendList = store.get("friendList") || []
  event.reply('recive_user_info', user)
})

ipcMain.on('upload_image', (event, arg) => {
  imgur.uploadFile(arg)
    .then(function(json) {
      store.set('avatar_url', json.data.link);
      event.reply("get_avatar_url", json.data.link)
    })
    .catch(function(err) {
      console.error(err.message);
    });
});

ipcMain.on('open_music_player', (event, arg) => {
  music_player = new BrowserWindow({
    // Set the initial width to 400px
    width: 305,
    // Set the initial height to 500px
    height: 555,
    // Don't show the window until it ready, this prevents any white flickering
    show: true,
    // Don't allow the window to be resized.
    resizable: false,

    frame: false,

    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
    }

  })

  // Load a URL in the window to the local index.html path
  music_player.loadURL(url.format({
    pathname: path.join(__dirname, 'music_player/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Show window when page is ready
  music_player.once('ready-to-show', () => {
    //window.maximize()
    music_player.setMenuBarVisibility(false)
    music_player.show()
  })

  music_player.on('resize', () => {
    let {
      width,
      height
    } = music_player.getBounds();
    console.log("width:" + width + " height:" + height)
  });

})
