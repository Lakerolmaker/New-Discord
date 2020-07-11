const {
  contextBridge,
  ipcRenderer,
  desktopCapturer,
  shell
} = require("electron");
const getLinkPreview = require('link-preview-js');


// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {

    request: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    response: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    get_desktopCapturer: () => {
      return desktopCapturer
    },
    open_link_in_browser: (link) => {
      shell.openExternal(link);
    }
  }
);
