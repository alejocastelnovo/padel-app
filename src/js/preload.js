const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    // Funciones de base de datos
    query: (sql, params) => ipcRenderer.invoke('db-query', sql, params),
    queryOne: (sql, params) => ipcRenderer.invoke('db-query-one', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db-run', sql, params),
    
    // Obtener la ruta de la base de datos
    getDbPath: () => ipcRenderer.invoke('get-db-path')
}); 