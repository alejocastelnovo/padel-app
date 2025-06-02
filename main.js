const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {

    try {
        require('electron-reloader')(module);
      } catch {} // Solo en desarrollo
    
      

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/index.html');
    // mainWindow.webContents.openDevTools(); // Descomentar para debug
}



app.whenReady().then(createWindow);