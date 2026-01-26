// 引入 Electron 主进程相关模块
import { app, BrowserWindow } from 'electron';
// 引入 Node.js 的 path 模块，用于处理文件路径
import path from 'node:path';
// 引入 electron-squirrel-startup 模块，用于处理 Windows 安装/卸载时的快捷方式
import started from 'electron-squirrel-startup';

// 如果是 Windows 安装/卸载过程，则直接退出应用
if (started) {
  app.quit();
}

// 创建主窗口函数
const createWindow = () => {
  // 创建浏览器窗口，设置宽高及预加载脚本
  const mainWindow = new BrowserWindow({
    width: 1024,  // 窗口宽度
    height: 800,  // 窗口高度
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 预加载脚本路径
    },
  });

  // 根据环境加载页面：开发环境使用 Vite 提供的 URL，生产环境加载本地 HTML 文件
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${'/html/'}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/html/index.html`));
  }

  // 打开开发者工具（默认注释掉）
  // mainWindow.webContents.openDevTools();
};

// Electron 初始化完成后，创建主窗口
app.whenReady().then(() => {
  createWindow();

  // macOS 特有：点击 dock 图标且无窗口时，重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用，macOS 除外（保持菜单栏活跃，直到用户 Cmd+Q 退出）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在此文件可继续添加主进程业务代码，或拆分为独立模块后引入
