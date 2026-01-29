/**
 * 主题服务模块
 * 负责管理 Electron 应用的主题模式（亮色/暗色）切换
 * 通过 IPC 通信与渲染进程交互，并提供单例模式访问
 */
import {BrowserWindow, ipcMain, nativeTheme} from 'electron';
import {logManager} from './LogService';
import { IPC_EVENTS } from '@common/constants';

/**
 * 主题服务类
 * 使用单例模式确保全局唯一实例
 */
class ThemeService {
    // 单例实例，用于保存 ThemeService 的唯一实例
    private static _instance: ThemeService;
    
    // 当前是否为暗色主题的标志位，初始值根据系统主题确定
    private _isDark: boolean = nativeTheme.shouldUseDarkColors;

    /**
     * 构造函数
     * 初始化时设置默认主题为暗色，并注册 IPC 事件监听
     */
    constructor() {
        // 默认主题模式为暗色
        const themeMode = 'dark';
        if(themeMode) {
            // 设置 Electron 原生主题源
            nativeTheme.themeSource = themeMode;
            // 根据设置后的主题更新内部标志位
            this._isDark = nativeTheme.shouldUseDarkColors;
        }
        // 注册 IPC 事件处理函数
        this._setupIpcEvent();
        // 记录服务初始化成功日志
        logManager.info('ThemeService initialized successfully');
    }

    /**
     * 私有方法：设置 IPC 事件监听
     * 用于处理来自渲染进程的主题相关请求
     */
    /**
     * 私有方法：注册所有与主题相关的 IPC 通信事件
     * 主进程通过此处暴露的接口，响应渲染进程对主题模式的查询与切换请求
     * 同时监听系统级主题变化，保证多窗口 UI 实时同步
     */
    private _setupIpcEvent() {
        /**
         * 1. 设置主题模式
         * 渲染进程调用：ipcRenderer.invoke(IPC_EVENTS.SET_THEME_MODE, 'dark' | 'light' | 'system')
         * 主进程收到后：
         *   - 立即将 nativeTheme.themeSource 设为指定值
         *   - 返回切换后的 shouldUseDarkColors 布尔值，供渲染进程判断当前是否处于暗色模式
         */
        ipcMain.handle(IPC_EVENTS.SET_THEME_MODE, (_e, mode: ThemeMode) => {
            // 将 Electron 原生主题源切换为指定模式
            nativeTheme.themeSource = mode;
            // 返回切换后的实际暗色状态，供渲染进程使用
            return nativeTheme.shouldUseDarkColors;
        });

        /**
         * 2. 获取当前主题模式
         * 渲染进程调用：ipcRenderer.invoke(IPC_EVENTS.GET_THEME_MODE)
         * 主进程直接返回 nativeTheme.themeSource，值为 'dark' | 'light' | 'system'
         */
        ipcMain.handle(IPC_EVENTS.GET_THEME_MODE, () => {
            // 返回当前主题源字符串
            return nativeTheme.themeSource;
        });

        /**
         * 3. 判断当前是否处于暗色主题
         * 渲染进程调用：ipcRenderer.invoke(IPC_EVENTS.IS_DARK_THEME)
         * 主进程返回布尔值，true 表示当前为暗色，false 表示亮色
         */
        ipcMain.handle(IPC_EVENTS.IS_DARK_THEME, () => {
            // 直接返回 Electron 提供的暗色标志位
            return nativeTheme.shouldUseDarkColors;
        });

        /**
         * 4. 监听系统主题变化（如用户在 Windows/macOS 设置里切换全局暗色模式）
         * 当系统主题发生改变时，Electron 会触发 nativeTheme 的 'updated' 事件
         * 主进程在此处：
         *   - 更新内部缓存的 _isDark 标志位
         *   - 向所有存在的渲染窗口广播 IPC 事件 IPC_EVENTS.THEME_MODE_UPDATED，
         *     携带最新的暗色状态，保证所有窗口 UI 实时刷新
         */
        nativeTheme.on('updated', () => {
            // 同步更新内部暗色标志位，保证 Service 内部状态与系统一致
            this._isDark = nativeTheme.shouldUseDarkColors;

            // 遍历当前所有打开的窗口，向每个窗口的渲染进程推送主题变更事件
            BrowserWindow.getAllWindows().forEach((win) => {
                // 发送事件名：IPC_EVENTS.THEME_MODE_UPDATED，数据：最新的暗色布尔值
                win.webContents.send(IPC_EVENTS.THEME_MODE_UPDATED, this._isDark);
            });
        });
    }
    /**
     * 获取 ThemeService 的单例实例
     * 如果实例不存在则创建，存在则直接返回
     */
    public static getInstance(): ThemeService {
        if(!this._instance){
            this._instance = new ThemeService();
        }
        return this._instance;
    }

    /**
     * 获取当前是否为暗色主题
     */
    public get isDark() {
        return this._isDark;
    }

    /**
     * 获取当前主题模式（亮色/暗色/系统）
     */
    public get themeMode() {
        return nativeTheme.themeSource;
    }
}

// 导出 ThemeService 的单例实例，供全局使用
export const themeManager = ThemeService.getInstance();

// 默认导出主题服务单例
export default themeManager;