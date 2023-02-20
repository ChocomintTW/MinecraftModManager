const { BrowserWindow } = require('electron');

let preloadProgress = new BrowserWindow({
	width: 300,
	height: 120,
  show: false,
  frame: false,
  autoHideMenuBar: true,
});
preloadProgress.setResizable(false);
preloadProgress.setMaximizable(false);
preloadProgress.setMinimizable(false);