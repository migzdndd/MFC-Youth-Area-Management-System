const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('MFCDesktop', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron
});
