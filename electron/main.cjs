const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3088);
let server;

async function startBackend() {
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(PORT);
  process.env.VLE_SERVER_STANDALONE = 'false';

  const serverModule = require(path.join(__dirname, '..', 'dist', 'server.cjs'));
  server = await serverModule.startServer({
    port: PORT,
    host: '127.0.0.1'
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'VLE Academic Workspace',
    backgroundColor: '#f5f3ee',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const localOrigin = `http://127.0.0.1:${PORT}`;
    if (!url.startsWith(localOrigin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  server?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
