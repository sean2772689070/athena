// 引入 Electron 主进程相关模块
import { app, BrowserWindow } from 'electron';
// 引入 electron-squirrel-startup 模块，用于处理 Windows 安装/卸载时的快捷方式
import started from 'electron-squirrel-startup';

import {setupWindows} from './wins'

// 如果是 Windows 安装/卸载过程，则直接退出应用
if (started) {
  app.quit();
}

// Electron 初始化完成后，创建主窗口
app.whenReady().then(() => {
  setupWindows();

  // macOS 特有：点击 dock 图标且无窗口时，重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      setupWindows();
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
