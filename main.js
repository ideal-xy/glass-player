const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // 隐藏原生标题栏，保留红绿灯
    vibrancy: 'fullscreen-ui',    // 开启 macOS 原生高斯模糊
    backgroundMaterial: 'acrylic', // Windows 11 亚克力效果(兼容)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // 允许跨域加载音频
    },
    backgroundColor: '#00000000', // 关键：完全透明背景
    show: false // 加载完再显示，防止白屏
  });

  // 加载页面
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // 准备好后优雅显示
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});