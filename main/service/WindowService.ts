/**
 * 窗口服务模块
 * 负责管理 Electron 应用中的所有窗口生命周期、IPC 通信以及窗口行为控制
 */

// 引入类型定义：窗口名称枚举
import { WindowNames } from '@common/type'
// 引入工具函数：防抖
import { debounce } from '@common/utils'
// 引入 IPC 事件常量
import { IPC_EVENTS } from '@common/constants'

// 引入 Electron 核心模块
import { BrowserWindow, BrowserWindowConstructorOptions, IpcMainInvokeEvent, type IpcMainEvent, ipcMain } from 'electron'
// 引入 Node.js 路径模块
import path from 'path'
import logManager from './LogService'

/**
 * 窗口尺寸配置接口
 * 用于创建窗口时指定宽高及可选的最大/最小尺寸限制
 */
interface SizeOptions {
    width: number; // 窗口宽度
    height: number; // 窗口高度
    maxWidth?: number; // 窗口最大宽度
    maxHeight?: number; // 窗口最大高度
    minWidth?: number; // 窗口最小宽度
    minHeight?: number; // 窗口最小高度
}

/**
 * 所有窗口共享的默认配置
 * 包括标题栏样式、窗口标题、WebPreferences 等
 */
const SHARED_WINDOW_OPTIONS = {
    // 隐藏原生标题栏，由前端自定义
    titleBarStyle: 'hidden',
    // 窗口默认标题
    title: 'Athena',
    webPreferences: {
        // 允许在渲染进程中使用 Node.js
        nodeIntegration: false,
        // 关闭上下文隔离（需确保安全性）
        contextIsolation: true,
        // 启用沙盒
        sandbox: true,
        // 禁止后台节流，保证定时器精度
        backgroundThrottling: false,
        // 指定预加载脚本路径
        preload: path.join(__dirname, 'preload.js'),
    }
} as BrowserWindowConstructorOptions;

/**
 * 窗口服务单例类
 * 提供窗口创建、关闭、最大化/还原等能力，并处理与渲染进程的 IPC 通信
 */
class WindowService {
    // 单例实例
    private static _instance: WindowService;

    /**
     * 私有构造函数，防止外部实例化
     * 初始化时注册 IPC 事件监听
     */
    private constructor() {
        this._setupIPcEvents()
        logManager.info('WindowService initialized successfully');
    }

    /**
     * 注册窗口相关 IPC 事件
     * 包括关闭、最小化、最大化/还原、查询是否最大化
     */
    private _setupIPcEvents() {
        // 关闭窗口事件处理
        const handleCloseWindow = (e: IpcMainEvent) => {
            this.close(BrowserWindow.fromWebContents(e.sender));
        }

        // 最小化窗口事件处理
        const handleMinimizeWindow = (e: IpcMainEvent) => {
            BrowserWindow.fromWebContents(e.sender)?.minimize();
        }

        // 最大化/还原窗口事件处理
        const handleIsMaximzeWindow = (e: IpcMainEvent) => {
            this.toggleMax(BrowserWindow.fromWebContents(e.sender));
        }
        
        // 查询窗口是否最大化事件处理（invoke 模式，需返回结果）
        const handleIsWindowMaximized = (e: IpcMainInvokeEvent) => {
            return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false;
        }

        // 注册 IPC 监听
        ipcMain.on(IPC_EVENTS.CLOSE_WINDOW, handleCloseWindow)
        ipcMain.on(IPC_EVENTS.MINIMIZE_WINDOW, handleMinimizeWindow)
        ipcMain.on(IPC_EVENTS.MAXIMIZE_WINDOW, handleIsMaximzeWindow)
        ipcMain.handle(IPC_EVENTS.IS_WINDOW_MAXIMIZED, handleIsWindowMaximized)
    }

    /**
     * 获取窗口服务单例
     * 首次调用时创建实例，后续直接返回
     */
    public static getInstance(): WindowService {
        if(!this._instance) {
            this._instance = new WindowService()
        }

        return this._instance
    }

    /**
     * 创建新窗口
     * @param name 窗口名称，对应渲染模板
     * @param size 窗口尺寸配置
     * @returns 创建好的 BrowserWindow 实例
     */
    public create(name: WindowNames, size: SizeOptions){
        // 合并默认配置与传入尺寸，创建窗口
        const window = new BrowserWindow({
            ...SHARED_WINDOW_OPTIONS,
            ...size,
        })

        // 链式调用：设置生命周期监听 & 加载页面模板
        this
        ._setupWinLifecycle(window, name)
        ._loadWindowTemplate(window, name)

        return window;
    }

    /**
     * 设置窗口生命周期监听
     * 包括窗口关闭清理、resize 防抖通知渲染进程
     */
    private _setupWinLifecycle(window: BrowserWindow, name: WindowNames){
        // 防抖函数：窗口 resize 时通知渲染进程当前是否可最大化
        const updateWinStatus = debounce(() => !window?.isDestroyed()
            && window?.webContents?.send(IPC_EVENTS.MAXIMIZE_WINDOW + 
                'back' , window?.isMaximizable()), 80);

        // 窗口关闭时清理资源
        window.once('closed', () => {
            window.destroy();
            window?.removeListener('resize', updateWinStatus);
            logManager.info(`Window closed: ${name}`);
        });

        // 监听 resize 事件，触发防抖更新
        window.on('resize', updateWinStatus);

        return this;
    }

    /**
     * 根据窗口名称加载对应页面模板
     * 开发环境使用 Vite  dev server，生产环境加载本地 html
     */
    private _loadWindowTemplate(window: BrowserWindow, name: WindowNames) {
        // 开发环境：通过 Vite  dev server 加载
        if(MAIN_WINDOW_VITE_DEV_SERVER_URL){
            return window.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${'/html/' + 
                (name === 'main'? '' : name)}`);
        }
        // 生产环境：加载打包后的本地 html 文件
        window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/
            html/${name === 'main'? 'index' : name}.html`));
    }

    /**
     * 关闭指定窗口
     * @param target 待关闭的 BrowserWindow
     */
    public close(target: BrowserWindow | void | null) {
        if(!target) return;
        target?.close();
    }

    /**
     * 切换窗口最大化/还原
     * @param target 待操作的 BrowserWindow
     */
    public toggleMax(target: BrowserWindow | void | null) {
        if(!target) return;
        target?.isMaximized()? target.unmaximize() : target.maximize();
    }
}

/**
 * 导出窗口管理器单例
 * 应用内统一通过 windowManager 访问窗口服务
 */
export const windowManager = WindowService.getInstance();

export default windowManager;