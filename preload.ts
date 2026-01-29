// 引入 Electron 的 contextBridge 与 ipcRenderer，用于安全地暴露 API 与主进程通信
import { contextBridge, ipcRenderer } from 'electron';
// 引入自定义的 IPC 事件常量，集中管理事件名，避免魔法字符串
import { IPC_EVENTS } from './common/constants';

// 定义一个符合 WindowApi 接口的对象，封装所有与窗口操作相关的方法
const api: WindowApi = {
    // 向主进程发送“关闭窗口”事件，主进程收到后执行关闭逻辑
    closeWindow: () => ipcRenderer.send(IPC_EVENTS.CLOSE_WINDOW),
    // 向主进程发送“最小化窗口”事件
    minimizeWindow: () => ipcRenderer.send(IPC_EVENTS.MINIMIZE_WINDOW),
    // 向主进程发送“最大化窗口”事件
    maximizeWindow: () => ipcRenderer.send(IPC_EVENTS.MAXIMIZE_WINDOW),
    // 注册最大化状态变化的监听器：当主进程广播“MAXIMIZE_WINDOWback”事件时，
    // 将 isMaximized 参数透传给前端传入的回调函数
    onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
        ipcRenderer.on(IPC_EVENTS.MAXIMIZE_WINDOW + 'back', (_, isMaximized) => callback(isMaximized)),
    // 使用 invoke 而非 send：需要主进程立即返回当前窗口是否最大化，避免监听/广播带来的时序与清理复杂度
    isWindowMaximized: () => ipcRenderer.invoke(IPC_EVENTS.IS_WINDOW_MAXIMIZED),

    // 设置主题模式：向主进程发送“设置主题模式”事件，并等待主进程返回设置结果
    setThemeMode: (mode: ThemeMode) => ipcRenderer.invoke(IPC_EVENTS.SET_THEME_MODE, mode),
    // 获取当前主题模式：向主进程发送“获取主题模式”事件，并返回当前主题模式值
    getThemeMode: () => ipcRenderer.invoke(IPC_EVENTS.GET_THEME_MODE),
    // 判断当前是否为暗黑主题：向主进程发送“是否为暗黑主题”事件，并返回布尔值结果
    isDarkTheme: () => ipcRenderer.invoke(IPC_EVENTS.IS_DARK_THEME),
    // 监听系统主题变化：当主进程广播“主题模式已更新”事件时，将暗黑状态参数透传给前端传入的回调函数
    onSystemThemeChange: (callback: (isDark: boolean) => void) =>
        ipcRenderer.on(IPC_EVENTS.THEME_MODE_UPDATED, (_, isDark) => callback(isDark)),
    
    // 向主进程发送“日志记录”事件，主进程收到后记录日志
    logger: {
        info: (msg: string, ...meta: any[]) => ipcRenderer.send(IPC_EVENTS.LOG_INFO, msg, ...meta),
        error: (msg: string, ...meta: any[]) => ipcRenderer.send(IPC_EVENTS.LOG_ERROR, msg, ...meta),
        debug: (msg: string, ...meta: any[]) => ipcRenderer.send(IPC_EVENTS.LOG_DEBUG, msg, ...meta),
        warn: (msg: string, ...meta: any[]) => ipcRenderer.send(IPC_EVENTS.LOG_WARN, msg, ...meta),
    }
};

// 通过 contextBridge 把 api 对象注入到渲染进程的全局 window 对象上，
// 前端页面即可通过 window.api.xxx 调用这些安全封装的窗口控制接口
contextBridge.exposeInMainWorld('api', api);